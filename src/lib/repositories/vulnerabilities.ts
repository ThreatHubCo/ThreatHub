import { RowDataPacket } from "mysql2";
import {
    CustomerVulnerabilityWithFullInfo,
    GlobalStats,
    Vulnerability,
    VulnerabilityEvent,
    VulnerabilityWithAllInfo
} from "../entities/Vulnerability";
import { pool } from "../mysql";
import { parseNumberFilters } from "../utils/utils";

export async function getVulnerabilityFull(id: number | string): Promise<VulnerabilityWithAllInfo | null> {
    const queryField = typeof id === "number" ? "id" : "cve_id";

    const [vulnRows] = await pool.query(
        "SELECT * FROM vulnerabilities WHERE ?? = ?",
        [queryField, id]
    );

    const vuln = (vulnRows as VulnerabilityWithAllInfo[])[0];
    if (!vuln) {
        return null;
    }

    const vulnId = vuln.id;

    const [
        exploitRows,
        referenceRows,
        affectedSoftwareRows,
        tagRows,
        affectedCustomersRows,
        affectedDevicesRows
    ] = await Promise.all([
        pool.query("SELECT * FROM vulnerability_exploit_types WHERE vulnerability_id = ?", [vulnId]),
        pool.query("SELECT * FROM vulnerability_references WHERE vulnerability_id = ?", [vulnId]),
        pool.query(`
            SELECT
                s.id,
                s.name,
                s.vendor,
                s.notes,
                vas.vulnerable_versions
            FROM vulnerability_affected_software vas
            INNER JOIN software s ON s.id = vas.software_id
            WHERE vas.vulnerability_id = ?
        `,
            [vulnId]
        ),
        pool.query("SELECT * FROM vulnerability_tags WHERE vulnerability_id = ?", [vulnId]),
        pool.query(`
            SELECT DISTINCT
                c.id,
                c.name,
                c.tenant_id,
                c.external_customer_id,
                c.supports_csp
            FROM device_vulnerabilities dv
            INNER JOIN customers c ON c.id = dv.customer_id
            WHERE dv.vulnerability_id = ?
              AND dv.status IN ('OPEN', 'RE_OPENED')
              AND c.deleted_at IS NULL
            ORDER BY c.name
        `,
            [vulnId]
        ),
        pool.query(`
            SELECT
                d.id,
                d.machine_id,
                d.dns_name,
                d.os_platform,
                d.os_version,
                d.os_build,
                d.last_seen_at,
                d.last_sync_at,
                dv.status,
                dv.detected_at,
                c.id AS customer_id,
                c.name AS customer_name
            FROM device_vulnerabilities dv
            INNER JOIN devices d ON d.id = dv.device_id
            INNER JOIN customers c ON c.id = d.customer_id
            WHERE dv.vulnerability_id = ?
              AND dv.status IN ('OPEN', 'RE_OPENED')
            ORDER BY c.name, d.dns_name
        `,
            [vulnId]
        )
    ]) as [any, any, any, any, any, any];

    return {
        ...vuln,
        exploit_types: exploitRows[0],
        references: referenceRows[0],
        affected_software: affectedSoftwareRows[0],
        tags: tagRows[0],
        affected_customers: affectedCustomersRows[0],
        affected_devices: affectedDevicesRows[0]
    }
}

export async function getCustomerVulnerabilityFull(customerId: number, id: number | string): Promise<CustomerVulnerabilityWithFullInfo | null> {
    const queryField = typeof id === "number" ? "v.id" : "v.cve_id";

    const [rows] = await pool.query(`
        SELECT DISTINCT
            v.*
        FROM vulnerabilities v
        INNER JOIN device_vulnerabilities dv ON dv.vulnerability_id = v.id
        WHERE dv.customer_id = ? 
          AND ${queryField} = ?
          AND dv.status IN ('OPEN', 'RE_OPENED')
        LIMIT 1
    `, [customerId, id]);

    const vuln = (rows as CustomerVulnerabilityWithFullInfo[])[0];
    if (!vuln) {
        return null;
    }

    const vulnId = vuln.id;

    const [
        exploitRows,
        referenceRows,
        affectedSoftwareRows,
        affectedDeviceRows,
        otherDeviceVulnCountsRows,
        tagRows,
        customerRows,
        affectedCountsRows
    ] = await Promise.all([
        pool.query("SELECT * FROM vulnerability_exploit_types WHERE vulnerability_id = ?", [vulnId]),
        pool.query("SELECT * FROM vulnerability_references WHERE vulnerability_id = ?", [vulnId]),
        pool.query(`
            SELECT
                s.id,
                s.name,
                s.vendor,
                s.notes,
                vas.vulnerable_versions
            FROM vulnerability_affected_software vas
            INNER JOIN software s ON s.id = vas.software_id
            WHERE vas.vulnerability_id = ?
        `, 
            [vulnId]
        ),
        pool.query(`
            SELECT d.*, dv.status, dv.detected_at, dv.software_id
            FROM device_vulnerabilities dv
            INNER JOIN devices d ON d.id = dv.device_id
            WHERE dv.vulnerability_id = ? 
              AND dv.customer_id = ?
              AND dv.status IN ('OPEN', 'RE_OPENED')
            ORDER BY d.dns_name
        `,
            [vulnId, customerId]
        ),
        pool.query(`
            SELECT 
                dv.device_id, 
                COUNT(*) AS total_other_open_vulns
            FROM device_vulnerabilities dv
            WHERE dv.device_id IN (
                SELECT dv2.device_id
                FROM device_vulnerabilities dv2
                WHERE dv2.vulnerability_id = ? AND dv2.customer_id = ?
                  AND dv2.status IN ('OPEN', 'RE_OPENED')
            )
            AND dv.status IN ('OPEN', 'RE_OPENED')
            AND dv.vulnerability_id != ?
            GROUP BY dv.device_id
        `, 
            [vulnId, customerId, vulnId]
        ),
        pool.query("SELECT * FROM vulnerability_tags WHERE vulnerability_id = ?", [vulnId]),
        pool.query("SELECT * FROM customers WHERE id = ?", [customerId]),
        pool.query(`
            SELECT 
                COUNT(DISTINCT dv.software_id) AS total_affected_software,
                COUNT(DISTINCT dv.device_id) AS total_affected_devices
            FROM device_vulnerabilities dv
            WHERE dv.vulnerability_id = ? 
              AND dv.customer_id = ?
              AND dv.status IN ('OPEN', 'RE_OPENED');
        `, [vulnId, customerId])
    ]) as [any, any, any, any, any, any, any, any];

    const affectedDevices = (affectedDeviceRows[0] as any[]);
    const otherVulnsMap = (otherDeviceVulnCountsRows[0] as any[]).reduce((acc, row) => {
        acc[row.device_id] = row.total_other_open_vulns;
        return acc;
    }, {} as Record<number, number>);

    const affectedDevicesWithCounts = affectedDevices.map(device => ({
        ...device,
        total_open_cves: otherVulnsMap[device.id] || 0
    }));

    return {
        ...vuln,
        last_partial_sync_at: new Date().toISOString(), 
        last_full_sync_at: new Date().toISOString(),
        exploit_types: exploitRows[0],
        references: referenceRows[0],
        affected_software: affectedSoftwareRows[0],
        affected_devices: affectedDevicesWithCounts,
        tags: tagRows[0],
        customer: customerRows[0][0],
        total_affected_software: affectedCountsRows[0][0].total_affected_software,
        total_affected_devices: affectedCountsRows[0][0].total_affected_devices
    }
}

// TODO: Move to the API route
const SORT_MAP: Record<string, string> = {
    published_at: "v.published_at",
    severity: "v.severity",
    public_exploit: "v.public_exploit",
    exploit_verified: "v.exploit_verified",
    cve_id: "v.cve_id",
    id: "v.id",
    cvss_v3: "v.cvss_v3",
    epss: "v.epss",
    total_affected_clients: "cv_count",
    total_affected_software: "vas_count",
    total_affected_devices: "dv_count",
    total_open_tickets: "rt_count"
}

export async function getVulnerabilities(
    filters?: {
        severity?: string;
        publicExploit?: string;
        exploitVerified?: string;
        cveId?: string;
        softwareName?: string;
        clientName?: string;
        hasAffectedClients?: boolean;
        epss?: string;
        total_affected_clients?: string;
        total_affected_software?: string;
        total_affected_devices?: string;
    },
    sortBy?: string,
    sortDir: "asc" | "desc" = "desc",
    page = 1,
    pageSize = 20
): Promise<{ vulnerabilities: any[]; totalItems: number; totalPages: number }> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.severity) {
        conditions.push("v.severity = ?");
        params.push(filters.severity);
    }
    if (filters?.cveId) {
        conditions.push("v.cve_id LIKE ?");
        params.push(`%${filters.cveId}%`);
    }
    if (filters?.publicExploit === "true" || filters?.publicExploit === "false") {
        conditions.push("v.public_exploit = ?");
        params.push(filters.publicExploit === "true" ? 1 : 0);
    }
    if (filters?.exploitVerified === "true" || filters?.exploitVerified === "false") {
        conditions.push("v.exploit_verified = ?");
        params.push(filters.exploitVerified === "true" ? 1 : 0);
    }

    const { conditions: epssCond, params: epssParams } = parseNumberFilters([{ value: filters?.epss, column: "v.epss" }]);
    conditions.push(...epssCond);
    params.push(...epssParams);

    if (filters?.hasAffectedClients !== undefined) {
        if (filters.hasAffectedClients) {
            conditions.push(`EXISTS (SELECT 1 FROM customer_vulnerabilities cv WHERE cv.vulnerability_id = v.id)`);
            conditions.push(`EXISTS (SELECT 1 FROM device_vulnerabilities dv WHERE dv.vulnerability_id = v.id)`);
        } else {
            conditions.push(`NOT EXISTS (SELECT 1 FROM device_vulnerabilities dv WHERE dv.vulnerability_id = v.id)`);
        }
    }

    if (filters?.softwareName) {
        conditions.push(`EXISTS (SELECT 1 FROM vulnerability_affected_software vas JOIN software s ON s.id = vas.software_id WHERE vas.vulnerability_id = v.id AND s.name LIKE ?)`);
        params.push(`%${filters.softwareName}%`);
    }
    if (filters?.clientName) {
        conditions.push(`EXISTS (SELECT 1 FROM customer_vulnerabilities cv JOIN customers c ON c.id = cv.customer_id WHERE cv.vulnerability_id = v.id AND c.name LIKE ?)`);
        params.push(`%${filters.clientName}%`);
    }

    const { conditions: havingConditions, params: havingParams } = parseNumberFilters([
        {
            value: filters?.total_affected_clients,
            column: "(SELECT COUNT(DISTINCT customer_id) FROM customer_vulnerabilities WHERE vulnerability_id = v.id)"
        },
        {
            value: filters?.total_affected_software,
            column: "(SELECT COUNT(DISTINCT software_id) FROM vulnerability_affected_software WHERE vulnerability_id = v.id)"
        },
        {
            value: filters?.total_affected_devices,
            column: "(SELECT COUNT(DISTINCT device_id) FROM device_vulnerabilities WHERE vulnerability_id = v.id)"
        }
    ]);

    conditions.push(...havingConditions);
    params.push(...havingParams);

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (page - 1) * pageSize;

    const sortColumn = sortBy && SORT_MAP[sortBy] ? SORT_MAP[sortBy] : "v.published_at";

    let sortJoin = "";
    if (sortBy === "total_affected_clients") {
        sortJoin = "LEFT JOIN (SELECT vulnerability_id, COUNT(DISTINCT customer_id) AS cv_count FROM customer_vulnerabilities GROUP BY vulnerability_id) cv_sort ON cv_sort.vulnerability_id = v.id";
    } else if (sortBy === "total_affected_software") {
        sortJoin = "LEFT JOIN (SELECT vulnerability_id, COUNT(DISTINCT software_id) AS vas_count FROM vulnerability_affected_software GROUP BY vulnerability_id) vas_sort ON vas_sort.vulnerability_id = v.id";
    } else if (sortBy === "total_affected_devices") {
        sortJoin = "LEFT JOIN (SELECT vulnerability_id, COUNT(DISTINCT device_id) AS dv_count FROM device_vulnerabilities GROUP BY vulnerability_id) dv_sort ON dv_sort.vulnerability_id = v.id";
    }

    const idQuery = `
        SELECT v.id
        FROM vulnerabilities v
        ${sortJoin}
        ${whereClause}
        ORDER BY ${sortColumn} ${sortDir}
        LIMIT ? OFFSET ?
    `;

    const [idRows]: any[] = await pool.query(idQuery, [...params, pageSize, offset]);
    const ids = idRows.map((r: any) => r.id);

    if (ids.length === 0) return { vulnerabilities: [], totalItems: 0, totalPages: 0 };

    const [rows]: any = await pool.query(
        `SELECT v.*, 
            COALESCE(agg_cv.total_clients, 0) AS total_affected_clients,
            COALESCE(agg_vas.total_software, 0) AS total_affected_software,
            COALESCE(agg_dv.total_devices, 0) AS total_affected_devices,
            COALESCE(agg_rt.total_open_tickets, 0) AS total_open_tickets
         FROM vulnerabilities v
         LEFT JOIN (SELECT vulnerability_id, COUNT(DISTINCT customer_id) AS total_clients FROM customer_vulnerabilities GROUP BY vulnerability_id) agg_cv ON agg_cv.vulnerability_id = v.id
         LEFT JOIN (SELECT vulnerability_id, COUNT(DISTINCT software_id) AS total_software FROM vulnerability_affected_software GROUP BY vulnerability_id) agg_vas ON agg_vas.vulnerability_id = v.id
         LEFT JOIN (SELECT vulnerability_id, COUNT(DISTINCT device_id) AS total_devices FROM device_vulnerabilities GROUP BY vulnerability_id) agg_dv ON agg_dv.vulnerability_id = v.id
         LEFT JOIN (
            SELECT vas.vulnerability_id, COUNT(*) AS total_open_tickets 
            FROM remediation_tickets rt 
            JOIN vulnerability_affected_software vas ON vas.software_id = rt.software_id 
            WHERE rt.status IN ('OPEN', 'CLOSED_GRACE_PERIOD') 
            GROUP BY vas.vulnerability_id
         ) agg_rt ON agg_rt.vulnerability_id = v.id
         WHERE v.id IN (${ids.map(() => "?").join(",")})
         ORDER BY FIELD(v.id, ${ids.map(() => "?").join(",")})`,
        [...ids, ...ids]
    );

    const [[{ total }]]: any = await pool.query(
        `SELECT COUNT(*) AS total FROM vulnerabilities v ${whereClause}`,
        params
    );

    return {
        vulnerabilities: rows,
        totalItems: Number(total),
        totalPages: Math.ceil(total / pageSize)
    }
}

export async function getCustomerVulnerabilities(
    customerId: number,
    filters?: {
        severity?: string;
        publicExploit?: boolean;
        exploitVerified?: boolean;
        cveId?: string;
    },
    sortBy?: string,
    sortDir: "asc" | "desc" = "desc",
    page = 1,
    pageSize = 20
): Promise<{
    vulnerabilities: (Vulnerability & {
        total_affected_software: number;
        total_affected_devices: number;
    })[];
    totalItems: number;
    totalPages: number;
}> {
    const conditions: string[] = ["dv.customer_id = ?"];
    const params: any[] = [customerId];

    conditions.push("dv.status IN ('OPEN', 'RE_OPENED')");

    if (filters?.severity) {
        conditions.push("v.severity = ?");
        params.push(filters.severity);
    }
    if (filters?.publicExploit !== undefined) {
        conditions.push("v.public_exploit = ?");
        params.push(filters.publicExploit ? 1 : 0);
    }
    if (filters?.exploitVerified !== undefined) {
        conditions.push("v.exploit_verified = ?");
        params.push(filters.exploitVerified ? 1 : 0);
    }
    if (filters?.cveId) {
        conditions.push("v.cve_id LIKE ?");
        params.push(`%${filters.cveId}%`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const orderClause = sortBy ? `ORDER BY ${sortBy} ${sortDir}` : `ORDER BY v.published_at DESC`;
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query(
        `
        SELECT 
            v.*,
            COUNT(DISTINCT dv.software_id) AS total_affected_software,
            COUNT(DISTINCT dv.device_id) AS total_affected_devices
        FROM vulnerabilities v
        INNER JOIN device_vulnerabilities dv ON dv.vulnerability_id = v.id
        ${whereClause}
        GROUP BY v.id
        ${orderClause}
        LIMIT ? OFFSET ?
        `,
        [...params, pageSize, offset]
    );

    const [[{ total }]]: any = await pool.query(
        `
        SELECT COUNT(*) AS total FROM (
            SELECT v.id
            FROM vulnerabilities v
            INNER JOIN device_vulnerabilities dv ON dv.vulnerability_id = v.id
            ${whereClause}
            GROUP BY v.id
        ) t
        `,
        params
    );

    return {
        vulnerabilities: rows as any,
        totalItems: Number(total || 0),
        totalPages: Math.ceil(Number(total || 0) / pageSize)
    }
}

export async function getVulnerabilityEvents(options?: {
    days?: number;
    customerId?: number;
    vulnerabilityId?: number;
}): Promise<VulnerabilityEvent[]> {
    let sql = `
        SELECT ve.*, v.cve_id
        FROM vulnerability_events ve 
        LEFT JOIN vulnerabilities v ON v.id = ve.vulnerability_id    
        WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (options?.days && options.days > 0) {
        sql += " AND ve.created_at >= NOW() - INTERVAL ? DAY";
        params.push(options.days);
    }

    if (options?.customerId !== undefined) {
        sql += " AND ve.customer_id = ?";
        params.push(options.customerId);
    }

    if (options?.vulnerabilityId !== undefined) {
        sql += " AND ve.vulnerability_id = ?";
        params.push(options.vulnerabilityId);
    }

    sql += " ORDER BY ve.created_at DESC";

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows as VulnerabilityEvent[];
}

export async function getGlobalStats(): Promise<GlobalStats> {
    const [[global]]: any = await pool.query(`
        SELECT
          COUNT(*) AS totalCvesGlobal,
          SUM(severity = 'Critical') AS totalCriticalCvesGlobal,
          SUM(public_exploit = 1) AS totalPublicExploitCvesGlobal
        FROM vulnerabilities
    `);

    const [[clientScoped]]: any = await pool.query(`
        SELECT
        COUNT(DISTINCT v.id) AS totalCvesAffectingClients,
        COUNT(DISTINCT CASE WHEN v.severity = 'Critical' THEN v.id END)
            AS totalCriticalCvesAffectingClients,
        COUNT(DISTINCT CASE WHEN v.public_exploit = 1 THEN v.id END)
            AS totalPublicExploitCvesAffectingClients
        FROM vulnerabilities v
        WHERE EXISTS (
            SELECT 1
            FROM customer_vulnerabilities cv
            WHERE cv.vulnerability_id = v.id
        )
        AND EXISTS (
            SELECT 1
            FROM device_vulnerabilities dv
            WHERE dv.vulnerability_id = v.id
        )
    `);

    /* Long-running exposed vulnerabilities */
    const [[oldExposed]]: any = await pool.query(`
    SELECT
      COUNT(DISTINCT v.id) AS exposedVulnerabilitiesOlderThan30Days
    FROM device_vulnerabilities dv
    JOIN vulnerabilities v ON v.id = dv.vulnerability_id
    WHERE dv.status IN ('OPEN', 'RE_OPENED')
      AND v.created_at < NOW() - INTERVAL 30 DAY
  `);

    /* New vulnerabilities in last 24h per customer */
    const [perCustomer24h] = await pool.query(`
    SELECT
      c.id AS customerId,
      c.name AS customerName,
      COUNT(DISTINCT v.id) AS total
    FROM vulnerabilities v
    JOIN device_vulnerabilities dv
      ON dv.vulnerability_id = v.id
     AND dv.status IN ('OPEN', 'RE_OPENED')
    JOIN devices d ON d.id = dv.device_id
    JOIN customers c ON c.id = d.customer_id
    WHERE v.created_at >= NOW() - INTERVAL 1 DAY
    GROUP BY c.id, c.name
    ORDER BY total DESC
  `);

    //     const [trends] = await pool.query(`
    //   SELECT
    //     DATE(cvc.created_at) AS day,
    //     c.id AS customerId,
    //     c.name AS customerName,
    //     COUNT(DISTINCT cvc.vulnerability_id) AS total
    //   FROM customer_vulnerability_counts cvc
    //   JOIN customers c ON c.id = cvc.customer_id
    //   WHERE cvc.created_at >= CURDATE() - INTERVAL 6 DAY
    //     AND cvc.affected_devices > 0
    //   GROUP BY day, c.id, c.name
    //   ORDER BY day ASC, customerName ASC
    // `);

    return {
        global: {
            totalCves: global.totalCvesGlobal,
            totalCriticalCves: global.totalCriticalCvesGlobal,
            totalPublicExploitCves: global.totalPublicExploitCvesGlobal,
        },
        clientScoped: {
            totalCves: clientScoped.totalCvesAffectingClients,
            totalCriticalCves: clientScoped.totalCriticalCvesAffectingClients,
            totalPublicExploitCves: clientScoped.totalPublicExploitCvesAffectingClients,
        },
        exposedVulnerabilitiesOlderThan30Days: oldExposed.exposedVulnerabilitiesOlderThan30Day,
        newVulnerabilitiesLast24hPerCustomer: perCustomer24h as any[],
        vulnerabilityTrendsLast7Days: []//trends as any[]
    }
}

export async function getSoftwareVulnerabilities(
    softwareId: number,
    customerId?: number,
    filters?: {
        severity?: string;
        publicExploit?: boolean;
        exploitVerified?: boolean;
        cveId?: string;
    },
    sortBy?: string,
    sortDir: "asc" | "desc" = "desc",
    page = 1,
    pageSize = 20
): Promise<{
    vulnerabilities: (Vulnerability & {
        total_affected_software: number;
        total_affected_devices: number;
    })[];
    totalItems: number;
    totalPages: number;
}> {
    const conditions: string[] = [];
    const params: any[] = [];

    conditions.push("vas.software_id = ?");
    params.push(softwareId);

    if (customerId) {
        conditions.push("d.customer_id = ?");
        params.push(customerId);
    }

    if (filters?.severity) {
        conditions.push("v.severity = ?");
        params.push(filters.severity);
    }

    if (filters?.publicExploit !== undefined) {
        conditions.push("v.public_exploit = ?");
        params.push(filters.publicExploit ? 1 : 0);
    }

    if (filters?.exploitVerified !== undefined) {
        conditions.push("v.exploit_verified = ?");
        params.push(filters.exploitVerified ? 1 : 0);
    }

    if (filters?.cveId) {
        conditions.push("v.cve_id LIKE ?");
        params.push(`%${filters.cveId}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderClause = sortBy ? `ORDER BY ${sortBy} ${sortDir}` : `ORDER BY v.published_at DESC`;
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query(
        `
        SELECT 
            v.*,
            COUNT(DISTINCT vas2.software_id) AS total_affected_software,
            COUNT(DISTINCT dv.device_id) AS total_affected_devices
        FROM vulnerabilities v
        INNER JOIN vulnerability_affected_software vas
            ON vas.vulnerability_id = v.id
        LEFT JOIN vulnerability_affected_software vas2
            ON vas2.vulnerability_id = v.id
        LEFT JOIN device_vulnerabilities dv
            ON dv.vulnerability_id = v.id
        LEFT JOIN devices d
            ON d.id = dv.device_id
        ${whereClause}
        GROUP BY v.id
        ${orderClause}
        LIMIT ? OFFSET ?
        `,
        [...params, pageSize, offset]
    );

    const [[{ total }]]: any = await pool.query(
        `
        SELECT COUNT(*) AS total FROM (
            SELECT v.id
            FROM vulnerabilities v
            INNER JOIN vulnerability_affected_software vas
                ON vas.vulnerability_id = v.id
            LEFT JOIN device_vulnerabilities dv
                ON dv.vulnerability_id = v.id
            LEFT JOIN devices d
                ON d.id = dv.device_id
            ${whereClause}
            GROUP BY v.id
        ) t
        `,
        params
    );

    return {
        vulnerabilities: rows as any,
        totalItems: Number(total || 0),
        totalPages: Math.ceil(Number(total || 0) / pageSize)
    }
}

export async function getDeviceVulnerabilities(
    deviceId: number,
    filters?: {
        severity?: string;
        publicExploit?: boolean;
        exploitVerified?: boolean;
        cveId?: string;
    },
    sortBy?: string,
    sortDir: "asc" | "desc" = "desc",
    page = 1,
    pageSize = 20
): Promise<{
    vulnerabilities: (Vulnerability & {
        total_affected_software: number;
        total_affected_devices: number;
    })[];
    totalItems: number;
    totalPages: number;
}> {
    const conditions: string[] = [];
    const params: any[] = [];

    conditions.push("dv.device_id = ?");
    params.push(deviceId);

    if (filters?.severity) {
        conditions.push("v.severity = ?");
        params.push(filters.severity);
    }

    if (filters?.publicExploit !== undefined) {
        conditions.push("v.public_exploit = ?");
        params.push(filters.publicExploit ? 1 : 0);
    }

    if (filters?.exploitVerified !== undefined) {
        conditions.push("v.exploit_verified = ?");
        params.push(filters.exploitVerified ? 1 : 0);
    }

    if (filters?.cveId) {
        conditions.push("v.cve_id LIKE ?");
        params.push(`%${filters.cveId}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderClause = sortBy ? `ORDER BY ${sortBy} ${sortDir}` : `ORDER BY v.published_at DESC`;
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query(`
        SELECT 
            v.*,
            COUNT(DISTINCT vas.software_id) AS total_affected_software,
            COUNT(DISTINCT dv2.device_id) AS total_affected_devices
        FROM vulnerabilities v
        INNER JOIN device_vulnerabilities dv ON dv.vulnerability_id = v.id
        LEFT JOIN vulnerability_affected_software vas ON vas.vulnerability_id = v.id
        LEFT JOIN device_vulnerabilities dv2 ON dv2.vulnerability_id = v.id
        ${whereClause}
        GROUP BY v.id
        ${orderClause}
        LIMIT ? OFFSET ?
    `,
        [...params, pageSize, offset]
    );

    const [[{ total }]]: any = await pool.query(`
        SELECT COUNT(*) AS total FROM (
            SELECT v.id
            FROM vulnerabilities v
            INNER JOIN device_vulnerabilities dv ON dv.vulnerability_id = v.id
            ${whereClause}
            GROUP BY v.id
        ) t
    `, params);

    return {
        vulnerabilities: rows as any,
        totalItems: Number(total),
        totalPages: Math.ceil(total / pageSize)
    }
}