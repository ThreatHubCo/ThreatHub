import { RowDataPacket } from "mysql2";
import { Software, SoftwareSummary } from "../entities/Software";
import { pool } from "../mysql";
import { parseNumberFilters } from "../utils/utils";

export async function getSoftwareById(id: number): Promise<Software | null> {
    const [rows] = await pool.query(`
        SELECT 
            s.id,
            COALESCE(s.formatted_name, s.name) AS name,
            COALESCE(s.formatted_vendor, s.vendor) AS vendor,
            s.summary,
            s.notes,
            s.auto_ticket_escalation_enabled
        FROM software s 
        WHERE id = ?
    `, [id]);
    return (rows as any[])[0] || null;
}

export async function getAffectedSoftware(
    filters: any,
    sortBy: string = "name",
    sortDir: "asc" | "desc" = "asc",
    page = 1,
    pageSize = 20
): Promise<{ software: SoftwareSummary[]; totalItems: number; totalPages: number }> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.name) {
        conditions.push("(s.name LIKE ? OR s.formatted_name LIKE ?)");
        params.push(`%${filters.name}%`, `%${filters.name}%`);
    }
    if (filters.vendor) {
        conditions.push("s.vendor LIKE ?");
        params.push(`%${filters.vendor}%`);
    }
    if (filters.auto_ticket_escalation_enabled !== undefined) {
        conditions.push("s.auto_ticket_escalation_enabled = ?");
        params.push(filters.auto_ticket_escalation_enabled === "true" ? 1 : 0);
    }

    const severityLogic = `CASE
        MAX(CASE v.severity
            WHEN 'Critical' THEN 4 WHEN 'High' THEN 3
            WHEN 'Medium' THEN 2 WHEN 'Low' THEN 1 ELSE 0
        END)
        WHEN 4 THEN 'Critical' WHEN 3 THEN 'High'
        WHEN 2 THEN 'Medium' WHEN 1 THEN 'Low' ELSE 'Unknown'
    END`;

    const { conditions: havingConditions, params: havingParams } = parseNumberFilters([
        { value: filters.highest_cve_epss, column: "MAX(v.epss)" },
        { value: filters.vulnerabilities_count, column: "COUNT(DISTINCT dv.vulnerability_id)" },
        { value: filters.devices_affected, column: "COUNT(DISTINCT dv.device_id)" },
        { value: filters.clients_affected, column: "COUNT(DISTINCT dv.customer_id)" }
    ]);

    if (filters.highest_cve_severity) {
        havingConditions.push(`${severityLogic} = ?`);
        havingParams.push(filters.highest_cve_severity);
    }

    if (filters.public_exploit !== undefined) {
        havingConditions.push("MAX(v.public_exploit) = ?");
        havingParams.push(filters.public_exploit === "true" ? 1 : 0);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const havingClause = havingConditions.length ? `HAVING ${havingConditions.join(" AND ")}` : "";
    
    const validSortColumns = ["name", "vendor", "devices_affected", "clients_affected", "vulnerabilities_count", "highest_cve_epss"];
    const activeSort = validSortColumns.includes(sortBy) ? sortBy : "name";
    
    const offset = (page - 1) * pageSize;

    const query = `
        SELECT
            s.id, 
            COALESCE(s.formatted_name, s.name) AS name,
            COALESCE(s.formatted_vendor, s.vendor) AS vendor,
            s.name AS defender_name,
            s.vendor AS defender_vendor,
            s.auto_ticket_escalation_enabled,
            COUNT(DISTINCT dv.customer_id) AS clients_affected,
            COUNT(DISTINCT dv.device_id) AS devices_affected,
            COUNT(DISTINCT dv.vulnerability_id) AS vulnerabilities_count,
            MAX(v.public_exploit) = 1 AS public_exploit,
            MAX(v.epss) AS highest_cve_epss,
            MAX(v.cvss_v3) AS highest_cve_cvss_v3,
            ${severityLogic} AS highest_cve_severity
        FROM software s
        INNER JOIN device_vulnerabilities dv ON dv.software_id = s.id
        INNER JOIN vulnerabilities v ON v.id = dv.vulnerability_id
        ${whereClause}
        AND dv.status IN ('OPEN', 'RE_OPENED')
        GROUP BY s.id
        ${havingClause}
        ORDER BY ${activeSort} ${sortDir}
        LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [...params, ...havingParams, pageSize, offset]);

    const countQuery = `
        SELECT COUNT(*) AS total FROM (
            SELECT s.id
            FROM software s
            INNER JOIN device_vulnerabilities dv ON dv.software_id = s.id
            INNER JOIN vulnerabilities v ON v.id = dv.vulnerability_id
            ${whereClause}
            AND dv.status IN ('OPEN', 'RE_OPENED')
            GROUP BY s.id
            ${havingClause}
        ) x
    `;

    const [[countResult]] = await pool.query<RowDataPacket[]>(countQuery, [...params, ...havingParams]);
    const total = countResult?.total || 0;

    return {
        software: rows as SoftwareSummary[],
        totalItems: total,
        totalPages: Math.ceil(total / pageSize)
    }
}

export async function updateSoftware(
    id: number,
    data: Partial<Pick<Software, "auto_ticket_escalation_enabled">>
): Promise<Software | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.auto_ticket_escalation_enabled !== undefined) {
        fields.push("auto_ticket_escalation_enabled = ?");
        values.push(data.auto_ticket_escalation_enabled);
    }

    if (fields.length === 0) {
        return getSoftwareById(id);
    }

    const [result] = await pool.query<any>(
        `UPDATE software SET ${fields.join(", ")} WHERE id = ?`,
        [...values, id]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    return getSoftwareById(id);
}

export async function getSoftwareByIdWithStats(id: number): Promise<any | null> {
    const [rows] = await pool.query(`
        SELECT
            s.*,
            COUNT(DISTINCT v.id) AS total_cves,
            COUNT(DISTINCT dv.device_id) AS total_affected_devices,
            MAX(
                CASE v.severity
                WHEN "Critical" THEN 4
                WHEN "High" THEN 3
                WHEN "Medium" THEN 2
                WHEN "Low" THEN 1
                ELSE 0
                END
            ) AS severity_rank,
            MAX(COALESCE(v.public_exploit, 0)) AS public_exploit,
            MAX(v.epss) AS highest_cve_epss
        FROM 
            software s
        LEFT JOIN vulnerability_affected_software vas ON vas.software_id = s.id
        LEFT JOIN vulnerabilities v ON v.id = vas.vulnerability_id
        LEFT JOIN device_vulnerabilities dv ON dv.vulnerability_id = v.id
        WHERE s.id = ?
        GROUP BY s.id
    `,
        [id]
    );

    const row = (rows as any[])[0];
    if (!row) return null;

    return {
        ...row,
        highest_cve_severity:
            row.severity_rank === 4 ? "Critical" :
                row.severity_rank === 3 ? "High" :
                    row.severity_rank === 2 ? "Medium" :
                        row.severity_rank === 1 ? "Low" :
                            null
    };
}

export async function getSoftwareStats(softwareId: number, customerId?: number): Promise<{
    totalCves: number;
    totalHighCves: number;
    totalCriticalCves: number;
    totalCustomers: number;
    totalDevices: number;
    totalTickets: number;
    totalPublicExploit: number;
    highestCveSeverity: "Critical" | "High" | "Medium" | "Low" | null;
    highestCveEpss: number | null;
}> {
    const ticketsParams: any[] = [softwareId];
    if (customerId) {
        ticketsParams.push(customerId);
    }

    const mainParams: any[] = [];
    let customerFilter = "";
    if (customerId) {
        customerFilter = "AND d.customer_id = ?";
        mainParams.push(customerId);
    }
    
    mainParams.push(softwareId);

  const [[stats]] = await pool.query<any>(`
        SELECT
            COUNT(DISTINCT dv.vulnerability_id) AS totalCves,
            COUNT(DISTINCT CASE WHEN v.severity = 'High' THEN v.id END) AS totalHighCves,
            COUNT(DISTINCT CASE WHEN v.severity = 'Critical' THEN v.id END) AS totalCriticalCves,
            COUNT(DISTINCT d.customer_id) AS totalCustomers,
            COUNT(DISTINCT d.id) AS totalDevices,
            COUNT(DISTINCT CASE WHEN v.public_exploit = 1 THEN v.id END) AS totalPublicExploit,
            MAX(v.epss) AS highestCveEpss,
            CASE
                WHEN SUM(v.severity = 'Critical') > 0 THEN 'Critical'
                WHEN SUM(v.severity = 'High') > 0 THEN 'High'
                WHEN SUM(v.severity = 'Medium') > 0 THEN 'Medium'
                WHEN SUM(v.severity = 'Low') > 0 THEN 'Low'
                ELSE NULL
            END AS highestCveSeverity,
            (
                SELECT COUNT(*)
                FROM remediation_tickets rt
                WHERE rt.software_id = ?
                ${customerId ? "AND rt.customer_id = ?" : ""}
            ) AS totalTickets
        FROM 
            device_vulnerabilities dv
        INNER JOIN vulnerabilities v ON v.id = dv.vulnerability_id
        INNER JOIN devices d ON d.id = dv.device_id
        INNER JOIN customers c ON c.id = d.customer_id AND c.deleted_at IS NULL
        WHERE dv.software_id = ?
          AND dv.status IN ("OPEN", "RE_OPENED")
          ${customerId ? "AND d.customer_id = ?" : ""}
    `,
        [...ticketsParams, softwareId, ...customerId ? [customerId] : []] 
    );
    return {
        totalCves: Number(stats.totalCves || 0),
        totalHighCves: Number(stats.totalHighCves || 0),
        totalCriticalCves: Number(stats.totalCriticalCves || 0),
        totalCustomers: Number(stats.totalCustomers || 0),
        totalDevices: Number(stats.totalDevices || 0),
        totalTickets: Number(stats.totalTickets || 0),
        totalPublicExploit: Number(stats.totalPublicExploit || 0),
        highestCveSeverity: stats.highestCveSeverity,
        highestCveEpss: stats.highestCveEpss !== null ? Number(stats.highestCveEpss) : null
    }
}