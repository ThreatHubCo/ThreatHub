import { pool } from "@/lib/mysql";
import { withApiHandler } from "@/lib/api";
import { RowDataPacket } from "mysql2";
import { parseNumberFilters } from "@/lib/utils/utils";

const sortableColumns = new Set<string>([
    "id", "name", "vendor", "public_exploit", "exploit_verified",
    "highest_cve_severity", "highest_cve_epss", "highest_cve_cvss_v3",
    "open_ticket_count", "vulnerabilities_count", "total_affected_devices"
]);

export default withApiHandler(async (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing customer identifier" });

    const customerId = Number(id);
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

    const sortBy = sortableColumns.has(req.query.sortBy as string) ? req.query.sortBy : "s.name";
    const sortDir = (req.query.sortDir as "asc" | "desc") || "desc";

    const conditions: string[] = ["cvs.customer_id = ?"];
    const params: any[] = [customerId];

    if (req.query.name) {
        conditions.push("s.name LIKE ?");
        params.push(`%${req.query.name}%`);
    }
    if (req.query.vendor) {
        conditions.push("s.vendor LIKE ?");
        params.push(`%${req.query.vendor}%`);
    }

    const { conditions: havingConditions, params: havingParams } = parseNumberFilters([
        { value: req.query.highest_cve_epss as string, column: "MAX(v.epss)" },
        { value: req.query.highest_cve_cvss_v3 as string, column: "MAX(v.cvss_v3)" },
        { value: req.query.vulnerabilities_count as string, column: "COUNT(DISTINCT cvs.vulnerability_id)" },
        { value: req.query.total_affected_devices as string, column: "COUNT(DISTINCT dv.device_id)" },
        { value: req.query.open_ticket_count as string, column: "COUNT(DISTINCT rt.id)" }
    ]);

    const severityLogic = `CASE
        MAX(CASE v.severity
            WHEN 'Critical' THEN 4 WHEN 'High' THEN 3
            WHEN 'Medium' THEN 2 WHEN 'Low' THEN 1 ELSE 0
        END)
        WHEN 4 THEN 'Critical' WHEN 3 THEN 'High'
        WHEN 2 THEN 'Medium' WHEN 1 THEN 'Low' ELSE 'Unknown'
    END`;

    if (req.query.highest_cve_severity) {
        havingConditions.push(`${severityLogic} = ?`);
        havingParams.push(req.query.highest_cve_severity as any);
    }

    if (req.query.public_exploit !== undefined) {
        havingConditions.push("MAX(v.public_exploit) = ?");
        havingParams.push(req.query.public_exploit === "true" ? 1 : 0);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const havingClause = havingConditions.length ? `HAVING ${havingConditions.join(" AND ")}` : "";
    const offset = (page - 1) * pageSize;

    const softwareSql = `
        SELECT
            s.*,
            COUNT(DISTINCT cvs.vulnerability_id) AS vulnerabilities_count,
            MAX(v.public_exploit) AS public_exploit,
            MAX(v.exploit_verified) AS exploit_verified,
            COUNT(DISTINCT dv.device_id) AS total_affected_devices,
            COUNT(DISTINCT rt.id) AS open_ticket_count,
            MAX(v.epss) AS highest_cve_epss,
            MAX(v.cvss_v3) AS highest_cve_cvss_v3,
            ${severityLogic} AS highest_cve_severity
        FROM software s
        JOIN customer_vulnerability_software cvs ON cvs.software_id = s.id
        JOIN vulnerabilities v ON v.id = cvs.vulnerability_id
        LEFT JOIN device_vulnerabilities dv 
            ON dv.vulnerability_id = v.id 
            AND dv.software_id = s.id 
            AND dv.customer_id = cvs.customer_id
            AND dv.status IN ('OPEN', 'RE_OPENED')
        LEFT JOIN remediation_tickets rt
            ON rt.software_id = s.id
            AND rt.customer_id = cvs.customer_id
            AND rt.status = 'OPEN'
        ${whereClause}
        GROUP BY s.id
        ${havingClause}
        ORDER BY ${sortBy === 'highest_cve_severity' ? severityLogic : sortBy} ${sortDir}
        LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(softwareSql, [...params, pageSize, offset]);

    const countSql = `
        SELECT COUNT(*) AS total FROM (
            SELECT s.id
            FROM software s
            JOIN customer_vulnerability_software cvs ON cvs.software_id = s.id
            JOIN vulnerabilities v ON v.id = cvs.vulnerability_id
            LEFT JOIN device_vulnerabilities dv 
                ON dv.vulnerability_id = v.id 
                AND dv.software_id = s.id 
                AND dv.customer_id = cvs.customer_id
                AND dv.status IN ('OPEN', 'RE_OPENED')
            LEFT JOIN remediation_tickets rt
                ON rt.software_id = s.id
                AND rt.customer_id = cvs.customer_id
                AND rt.status = 'OPEN'
            ${whereClause}
            GROUP BY s.id
            ${havingClause}
        ) x
    `;

    const [[countResult]] = await pool.query<RowDataPacket[]>(countSql, params);
    const total = countResult?.total || 0;

    const software = (rows as any[]).map(row => ({
        ...row,
        vulnerabilities_count: Number(row.vulnerabilities_count),
        total_affected_devices: Number(row.total_affected_devices),
        open_ticket_count: Number(row.open_ticket_count),
        public_exploit: Boolean(row.public_exploit),
        exploit_verified: Boolean(row.exploit_verified),
        highest_cve_epss: row.highest_cve_epss !== null ? Number(row.highest_cve_epss) : null,
        highest_cve_cvss_v3: row.highest_cve_cvss_v3 !== null ? Number(row.highest_cve_cvss_v3) : null
    }));

    return res.status(200).json({
        rows: software,
        meta: {
            totalItems: total,
            totalPages: Math.ceil(total / pageSize)
        }
    });
}, {
    methods: ["GET"],
    authRequired: true
});