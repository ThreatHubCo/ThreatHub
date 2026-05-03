import { RowDataPacket } from "mysql2";
import { pool } from "../mysql";
import { Device, DeviceSummary, DeviceWithVulnerabilities } from "../entities/Device";
import { parseNumberFilters } from "../utils/utils";
import { SoftwareSummary } from "../entities/Software";

export async function getDeviceById(id: number): Promise<Device | null> {
    const [rows] = await pool.query<any>(`
        SELECT 
            d.*,
            c.supports_csp AS customer_supports_csp,
            c.name AS customer_name,
            c.tenant_id AS customer_tenant_id
        FROM devices d
        LEFT JOIN customers c ON c.id = d.customer_id
        WHERE d.id = ?
    `,
        [id]
    );

    return rows[0] || null;
}

export async function getDevicesForVulnerabilities(vulnerabilityIds: number[]): Promise<number[]> {
    if (!vulnerabilityIds?.length) {
        return [];
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT DISTINCT dv.device_id
        FROM device_vulnerabilities dv
        WHERE dv.vulnerability_id IN (?) AND dv.status = 'OPEN'
    `,
        [vulnerabilityIds]
    );

    return rows.map((r: any) => r.device_id);
}

export async function getDevicesForVulnerabilitiesFull(vulnerabilityIds: number[]): Promise<DeviceWithVulnerabilities[]> {
    if (!vulnerabilityIds?.length) {
        return [];
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT 
            d.id AS device_id,
            d.machine_id,
            d.dns_name,
            d.os_platform,
            d.asset_criticality_level,
            d.customer_id,
            dv.vulnerability_id,
            dv.status,
            dv.detected_at
        FROM device_vulnerabilities dv
        INNER JOIN devices d ON d.id = dv.device_id
        WHERE dv.vulnerability_id IN (?) AND dv.status = 'OPEN'
        ORDER BY d.id;
    `,
        [vulnerabilityIds]
    );
    return rows as DeviceWithVulnerabilities[];
}

export async function getDevicesGlobalSummary(
    dnsName?: string,
    machineId?: string,
    osPlatform?: string,
    customerName?: string,
    entraJoined?: string,
    totalVulnerabilities?: string,
    totalAffectedSoftware?: string,
    page = 1,
    pageSize = 20,
    sortBy?: string,
    sortDir: "asc" | "desc" = "desc"
): Promise<{ devices: DeviceSummary[]; totalItems: number; totalPages: number; totalStaleDevices: number; totalStaleDevices60Days: number; totalNotEntraJoined: number }> {

    const conditions: string[] = [];
    const params: any[] = [];

    const { conditions: havingConditions, params: havingParams } = parseNumberFilters([
        {
            value: totalVulnerabilities,
            column: "COUNT(DISTINCT dv.id)"
        },
        {
            value: totalAffectedSoftware,
            column: "COUNT(DISTINCT s.id)"
        }
    ]);

    if (dnsName) {
        conditions.push("d.dns_name LIKE ?");
        params.push(`%${dnsName}%`);
    }

    if (machineId) {
        conditions.push("d.machine_id LIKE ?");
        params.push(`%${machineId}%`);
    }

    if (osPlatform) {
        conditions.push("d.os_platform LIKE ?");
        params.push(`%${osPlatform}%`);
    }

    if (customerName) {
        conditions.push("c.name LIKE ?");
        params.push(`%${customerName}%`);
    }

    if (entraJoined === "true" || entraJoined === "false") {
        conditions.push("d.is_aad_joined = ?");
        params.push(entraJoined === "true" ? 1 : 0);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderClause = sortBy ? `ORDER BY ${sortBy} ${sortDir}` : "ORDER BY d.created_at DESC";
    const havingClause = havingConditions.length ? `HAVING ${havingConditions.join(" AND ")}` : "";

    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
            d.id AS device_id,
            d.machine_id,
            d.dns_name,
            d.os_platform,
            d.os_version,
            d.is_aad_joined,
            d.aad_device_id,
            d.last_sync_at,
            d.last_seen_at,
            d.customer_id,

            c.name AS customer_name,
            c.tenant_id AS customer_tenant_id,
            c.supports_csp AS customer_supports_csp,

            COUNT(DISTINCT dn.id) AS total_notes,
            COUNT(DISTINCT dv.id) AS total_vulnerabilities,
            COUNT(DISTINCT s.id) AS total_affected_software,
            COUNT(DISTINCT CASE WHEN v.severity = 'CRITICAL' THEN dv.vulnerability_id END) AS total_critical_vulnerabilities,
            COUNT(DISTINCT CASE WHEN v.severity = 'HIGH' THEN dv.vulnerability_id END) AS total_high_vulnerabilities

        FROM devices d

        INNER JOIN customers c ON c.id = d.customer_id

        LEFT JOIN device_notes dn 
            ON dn.device_id = d.id
            AND dn.deleted_at IS NULL

        LEFT JOIN device_vulnerabilities dv
            ON dv.device_id = d.id
            AND (dv.status = 'OPEN' OR dv.status = 'RE_OPENED')

        LEFT JOIN vulnerabilities v ON v.id = dv.vulnerability_id
        LEFT JOIN vulnerability_affected_software vas ON vas.vulnerability_id = dv.vulnerability_id
        LEFT JOIN software s ON s.id = vas.software_id

        ${whereClause}

        GROUP BY d.id
        ${havingClause}
        ${orderClause}
        LIMIT ? OFFSET ?
        `,
        [...params, ...havingParams, pageSize, offset]
    );

    const [[{ total, stale_total, stale_total_60, total_not_entra_joined }]] = await pool.query<RowDataPacket[]>(`
        SELECT 
            COUNT(*) AS total,
            COALESCE(SUM(is_stale), 0) AS stale_total,
            COALESCE(SUM(is_stale_60), 0) AS stale_total_60,
            COALESCE(SUM(is_not_entra_joined), 0) AS total_not_entra_joined
        FROM (
            SELECT 
                d.id,
                CASE 
                    WHEN d.last_seen_at < NOW() - INTERVAL 30 DAY THEN 1
                    ELSE 0
                END AS is_stale,
                CASE 
                    WHEN d.last_seen_at < NOW() - INTERVAL 60 DAY THEN 1
                    ELSE 0
                END AS is_stale_60,
                CASE
                    WHEN d.is_aad_joined = 0 OR d.is_aad_joined IS NULL THEN 1
                    ELSE 0
                END AS is_not_entra_joined
            FROM devices d
            INNER JOIN customers c ON c.id = d.customer_id
            LEFT JOIN device_vulnerabilities dv 
                ON dv.device_id = d.id 
                AND (dv.status = 'OPEN' OR dv.status = 'RE_OPENED')
            LEFT JOIN vulnerability_affected_software vas 
                ON vas.vulnerability_id = dv.vulnerability_id
            LEFT JOIN software s 
                ON s.id = vas.software_id
            ${whereClause}
            GROUP BY d.id
            ${havingClause}
        ) x
    `,
        [...params, ...havingParams]
    );

    return {
        devices: rows as DeviceSummary[],
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
        totalStaleDevices: stale_total,
        totalStaleDevices60Days: stale_total_60,
        totalNotEntraJoined: total_not_entra_joined
    }
}

export async function getDevicesForCustomerSummary(
    customerId: number,
    dnsName?: string,
    machineId?: string,
    osPlatform?: string,
    entraJoined?: string,
    totalVulnerabilities?: string,
    totalAffectedSoftware?: string,
    page = 1,
    pageSize = 20,
    sortBy?: string,
    sortDir: "asc" | "desc" = "desc"
): Promise<{ devices: DeviceSummary[]; totalItems: number; totalPages: number }> {

    const conditions: string[] = ["d.customer_id = ?"];
    const params: any[] = [customerId];

    const { conditions: havingConditions, params: havingParams } = parseNumberFilters([
        {
            value: totalVulnerabilities,
            column: "COUNT(DISTINCT dv.id)"
        },
        {
            value: totalAffectedSoftware,
            column: "COUNT(DISTINCT dv.software_id)"
        }
    ]);

    if (dnsName) {
        conditions.push("d.dns_name LIKE ?");
        params.push(`%${dnsName}%`);
    }

    if (machineId) {
        conditions.push("d.machine_id LIKE ?");
        params.push(`%${machineId}%`);
    }

    if (osPlatform) {
        conditions.push("d.os_platform = ?");
        params.push(osPlatform);
    }

    if (entraJoined === "true" || entraJoined === "false") {
        conditions.push("d.is_aad_joined = ?");
        params.push(entraJoined === "true" ? 1 : 0);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const orderClause = sortBy ? `ORDER BY ${sortBy} ${sortDir}` : "ORDER BY d.created_at DESC";
    const havingClause = havingConditions.length ? `HAVING ${havingConditions.join(" AND ")}` : "";

    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
            d.id AS device_id,
            d.machine_id,
            d.dns_name,
            d.os_platform,
            d.os_version,
            d.is_aad_joined,
            d.aad_device_id,
            d.last_sync_at,
            d.last_seen_at,
            d.customer_id,

            COUNT(DISTINCT dn.id) AS total_notes,
            COUNT(DISTINCT dv.id) AS total_vulnerabilities,
            COUNT(DISTINCT dv.software_id) AS total_affected_software,
            COUNT(DISTINCT CASE WHEN v.severity = 'CRITICAL' THEN dv.vulnerability_id END) AS total_critical_vulnerabilities,
            COUNT(DISTINCT CASE WHEN v.severity = 'HIGH' THEN dv.vulnerability_id END) AS total_high_vulnerabilities

        FROM devices d

        LEFT JOIN device_notes dn 
            ON dn.device_id = d.id
            AND dn.deleted_at IS NULL

        LEFT JOIN device_vulnerabilities dv
            ON dv.device_id = d.id
            AND (dv.status = 'OPEN' OR dv.status = 'RE_OPENED')

        LEFT JOIN vulnerabilities v ON v.id = dv.vulnerability_id

        ${whereClause}

        GROUP BY d.id
        ${havingClause}
        ${orderClause}
        LIMIT ? OFFSET ?
    `,
        [...params, ...havingParams, pageSize, offset]
    );

    const [[{ total }]] = await pool.query<RowDataPacket[]>(`
        SELECT COUNT(*) AS total FROM (
            SELECT d.id
            FROM devices d
            LEFT JOIN device_vulnerabilities dv
                ON dv.device_id = d.id
                AND (dv.status = 'OPEN' OR dv.status = 'RE_OPENED')
            ${whereClause}
            GROUP BY d.id
            ${havingClause}
        ) x
    `,
        [...params, ...havingParams]
    );

    return {
        devices: rows as DeviceSummary[],
        totalItems: Number(total || 0),
        totalPages: Math.ceil(Number(total || 0) / pageSize)
    }
}

export async function getDevicesForSoftwareSummary(
    softwareId: number,
    customerId?: number,
    dnsName?: string,
    machineId?: string,
    osPlatform?: string,
    entraJoined?: string,
    totalVulnerabilities?: string,
    page = 1,
    pageSize = 20,
    sortBy?: string,
    sortDir: "asc" | "desc" = "desc"
): Promise<{ devices: DeviceSummary[]; totalItems: number; totalPages: number }> {

    const conditions: string[] = ["dv_filter.software_id = ?"];
    const params: any[] = [softwareId];

    if (customerId) {
        conditions.push("d.customer_id = ?");
        params.push(customerId);
    }
    if (dnsName) {
        conditions.push("d.dns_name LIKE ?");
        params.push(`%${dnsName}%`);
    }
    if (machineId) {
        conditions.push("d.machine_id LIKE ?");
        params.push(`%${machineId}%`);
    }
    if (osPlatform) {
        conditions.push("d.os_platform = ?");
        params.push(osPlatform);
    }
    if (entraJoined === "true" || entraJoined === "false") {
        conditions.push("d.is_aad_joined = ?");
        params.push(entraJoined === "true" ? 1 : 0);
    }

    const { conditions: havingConditions, params: havingParams } = parseNumberFilters([
        {
            value: totalVulnerabilities,
            column: "COUNT(DISTINCT dv_all.id)" 
        }
    ]);

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const havingClause = havingConditions.length ? `HAVING ${havingConditions.join(" AND ")}` : "";
    const orderClause = sortBy ? `ORDER BY ${sortBy} ${sortDir}` : "ORDER BY d.created_at DESC";
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
            d.id AS device_id,
            d.machine_id,
            d.dns_name,
            d.os_platform,
            d.os_version,
            d.is_aad_joined,
            d.aad_device_id,
            d.last_sync_at,
            d.last_seen_at,
            d.customer_id,
            COUNT(DISTINCT dn.id) AS total_notes,
            COUNT(DISTINCT dv_all.id) AS total_vulnerabilities
        FROM devices d
        -- This join ensures the device has the software you are looking for
        INNER JOIN device_vulnerabilities dv_filter 
            ON dv_filter.device_id = d.id 
            AND dv_filter.software_id = ? 
        -- This join gets ALL open vulnerabilities for the device to provide an accurate count
        LEFT JOIN device_vulnerabilities dv_all 
            ON dv_all.device_id = d.id 
            AND (dv_all.status = 'OPEN' OR dv_all.status = 'RE_OPENED')
        LEFT JOIN device_notes dn 
            ON dn.device_id = d.id
            AND dn.deleted_at IS NULL
        ${whereClause}
        GROUP BY d.id
        ${havingClause}
        ${orderClause}
        LIMIT ? OFFSET ?
        `,
        [softwareId, ...params, ...havingParams, pageSize, offset]
    );

    const [[{ total }]] = await pool.query<RowDataPacket[]>(`
        SELECT COUNT(*) AS total FROM (
            SELECT d.id
            FROM devices d
            
            -- Filter: Device must have the specific software
            INNER JOIN device_vulnerabilities dv_filter 
                ON dv_filter.device_id = d.id 
                AND dv_filter.software_id = ?

            -- Count: Get all open vulnerabilities for the HAVING clause check
            LEFT JOIN device_vulnerabilities dv_all 
                ON dv_all.device_id = d.id 
                AND (dv_all.status = 'OPEN' OR dv_all.status = 'RE_OPENED')

            ${whereClause}
            
            GROUP BY d.id
            ${havingClause}
        ) x
    `,
        [softwareId, ...params, ...havingParams]
    );

    return {
        devices: rows as DeviceSummary[],
        totalItems: Number(total || 0),
        totalPages: Math.ceil(Number(total || 0) / pageSize)
    };
}

export async function getDeviceAffectedSoftware(
    deviceId: number,
    name?: string,
    vendor?: string,
    sortBy: string = "name",
    sortDir: "asc" | "desc" = "asc",
    page = 1,
    pageSize = 20
): Promise<{
    software: SoftwareSummary[];
    totalItems: number;
    totalPages: number;
}> {
    const conditions: string[] = ["dv.device_id = ?"];
    const params: any[] = [deviceId];

    if (name) {
        conditions.push("s.name LIKE ?");
        params.push(`%${name}%`);
    }

    if (vendor) {
        conditions.push("s.vendor LIKE ?");
        params.push(`%${vendor}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderClause = `ORDER BY ${sortBy} ${sortDir}`;
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
            s.id,
            s.name,
            s.vendor,
            s.auto_ticket_escalation_enabled,

            COUNT(DISTINCT dv.device_id) AS devices_affected,
            COUNT(DISTINCT dv.vulnerability_id) AS vulnerabilities_count,

            MAX(v.public_exploit) = 1 AS public_exploit,
            MAX(v.epss) AS highest_cve_epss,
            MAX(v.cvss_v3) AS highest_cve_cvss_v3,

            CASE
                MAX(
                    CASE v.severity
                        WHEN 'Critical' THEN 4
                        WHEN 'High' THEN 3
                        WHEN 'Medium' THEN 2
                        WHEN 'Low' THEN 1
                        ELSE 0
                    END
                )
                WHEN 4 THEN 'Critical'
                WHEN 3 THEN 'High'
                WHEN 2 THEN 'Medium'
                WHEN 1 THEN 'Low'
                ELSE 'Unknown'
            END AS highest_cve_severity

        FROM device_vulnerabilities dv
        INNER JOIN software s ON s.id = dv.software_id
        INNER JOIN vulnerabilities v ON v.id = dv.vulnerability_id
        LEFT JOIN vulnerability_affected_software vas 
            ON vas.vulnerability_id = dv.vulnerability_id
            AND vas.software_id = dv.software_id

        ${whereClause}
        GROUP BY s.id
        ${orderClause}
        LIMIT ? OFFSET ?
    `,
        [...params, pageSize, offset]
    );

    const [[{ total }]] = await pool.query<RowDataPacket[]>(`
        SELECT COUNT(DISTINCT s.id) AS total
        FROM device_vulnerabilities dv
        INNER JOIN software s ON s.id = dv.software_id
        INNER JOIN vulnerabilities v ON v.id = dv.vulnerability_id
        ${whereClause}
    `,
        params
    );

    return {
        software: rows as SoftwareSummary[],
        totalItems: total,
        totalPages: Math.ceil(total / pageSize)
    }
}

export async function getDeviceStats(deviceId: number): Promise<{
    totalCves: number;
    totalHighCves: number;
    totalCriticalCves: number;
    totalPublicExploit: number;
    highestCveSeverity: 'Critical' | 'High' | 'Medium' | 'Low' | null;
    highestCveEpss: number | null;
    totalSoftware: number;
}> {
   const [[stats]] = await pool.query<any>(`
        SELECT
        COUNT(DISTINCT dv.vulnerability_id) AS totalCves,

        COUNT(DISTINCT CASE WHEN v.severity = 'High' THEN dv.vulnerability_id END) AS totalHighCves,
        COUNT(DISTINCT CASE WHEN v.severity = 'Critical' THEN dv.vulnerability_id END) AS totalCriticalCves,

        COUNT(DISTINCT CASE WHEN v.public_exploit = 1 THEN dv.vulnerability_id END) AS totalPublicExploit,

        MAX(v.epss) AS highestCveEpss,

        CASE
            WHEN SUM(v.severity = 'Critical') > 0 THEN 'Critical'
            WHEN SUM(v.severity = 'High') > 0 THEN 'High'
            WHEN SUM(v.severity = 'Medium') > 0 THEN 'Medium'
            WHEN SUM(v.severity = 'Low') > 0 THEN 'Low'
            ELSE NULL
        END AS highestCveSeverity,

        COUNT(DISTINCT dv.software_id) AS totalSoftware

        FROM device_vulnerabilities dv
        INNER JOIN vulnerabilities v
        ON v.id = dv.vulnerability_id
        WHERE dv.device_id = ?
        AND dv.status IN ('OPEN', 'RE_OPENED')
        `,
        [deviceId]
    );

    return {
        totalCves: Number(stats.totalCves),
        totalHighCves: Number(stats.totalHighCves),
        totalCriticalCves: Number(stats.totalCriticalCves),
        totalPublicExploit: Number(stats.totalPublicExploit),
        highestCveSeverity: stats.highestCveSeverity,
        highestCveEpss: stats.highestCveEpss !== null ? Number(stats.highestCveEpss) : null,
        totalSoftware: Number(stats.totalSoftware)
    }
}