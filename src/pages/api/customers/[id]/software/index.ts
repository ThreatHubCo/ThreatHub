import { pool } from "@/lib/mysql";
import { withApiHandler } from "@/lib/api";
import { RowDataPacket } from "mysql2";
import { parseNumberFilters } from "@/lib/utils/utils";

const sortableColumns = new Set<string>([
    "id",
    "name",
    "defender_name",
    "vendor",
    "public_exploit",
    "exploit_verified",
    "highest_cve_severity",
    "highest_cve_epss",
    "highest_cve_cvss_v3",
    "open_ticket_count",
    "vulnerabilities_count",
    "total_affected_devices"
]);

export default withApiHandler(async (req, res, session) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing customer identifier" });

    const customerId = Number(id);
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

    const sortBy = sortableColumns.has(req.query.sortBy as string) ? req.query.sortBy : "s.name";
    const sortDir = (req.query.sortDir as "asc" | "desc") || "desc";

    const conditions: string[] = ["cv.customer_id = ?"];
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
        { value: req.query.vulnerabilities_count as string, column: "COUNT(DISTINCT vas.vulnerability_id)" },
        { value: req.query.total_affected_devices as string, column: "COUNT(DISTINCT d.id)" },
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
            COUNT(DISTINCT vas.vulnerability_id) AS vulnerabilities_count,
            MAX(v.public_exploit) AS public_exploit,
            MAX(v.exploit_verified) AS exploit_verified,
            COUNT(DISTINCT d.id) AS total_affected_devices,
            COUNT(DISTINCT rt.id) AS open_ticket_count,
            MAX(v.epss) AS highest_cve_epss,
            MAX(v.cvss_v3) AS highest_cve_cvss_v3,
            GROUP_CONCAT(vas.vulnerable_versions SEPARATOR '|') AS vulnerable_versions,
            ${severityLogic} AS highest_cve_severity
        FROM software s
        JOIN vulnerability_affected_software vas ON vas.software_id = s.id
        JOIN customer_vulnerabilities cv ON cv.vulnerability_id = vas.vulnerability_id
        JOIN vulnerabilities v ON v.id = vas.vulnerability_id
        LEFT JOIN device_vulnerabilities dv ON dv.vulnerability_id = v.id
        LEFT JOIN devices d ON d.id = dv.device_id AND d.customer_id = ?
        LEFT JOIN remediation_tickets rt ON rt.software_id = s.id AND rt.customer_id = ? AND rt.status = 'OPEN'
        ${whereClause}
        GROUP BY s.id
        ${havingClause}
        ORDER BY ${sortBy || 's.name'} ${sortDir}
        LIMIT ? OFFSET ?
    `;

    const queryParams = [customerId, customerId, ...params, ...havingParams, pageSize, offset];
    const [rows] = await pool.query<RowDataPacket[]>(softwareSql, queryParams);

    const countSql = `
        SELECT COUNT(*) AS total FROM (
            SELECT s.id
            FROM software s
            JOIN vulnerability_affected_software vas ON vas.software_id = s.id
            JOIN customer_vulnerabilities cv ON cv.vulnerability_id = vas.vulnerability_id
            JOIN vulnerabilities v ON v.id = vas.vulnerability_id
            LEFT JOIN device_vulnerabilities dv ON dv.vulnerability_id = v.id
            LEFT JOIN devices d ON d.id = dv.device_id AND d.customer_id = ?
            LEFT JOIN remediation_tickets rt ON rt.software_id = s.id AND rt.customer_id = ? AND rt.status = 'OPEN'
            ${whereClause}
            GROUP BY s.id
            ${havingClause}
        ) x
    `;

    const [[countResult]] = await pool.query<RowDataPacket[]>(countSql, [customerId, customerId, ...params, ...havingParams]);
    const total = countResult?.total || 0;

    const software = (rows as any[]).map(row => {
        const versions = row.vulnerable_versions
            ? [...new Set(row.vulnerable_versions.split("|").map(v => v.trim()).filter(Boolean))]
            : [];

        return {
            ...row,
            vulnerable_versions: versions.join(", "),
            vulnerabilities_count: Number(row.vulnerabilities_count),
            total_affected_devices: Number(row.total_affected_devices),
            open_ticket_count: Number(row.open_ticket_count),
            public_exploit: Boolean(row.public_exploit),
            exploit_verified: Boolean(row.exploit_verified),
            highest_cve_epss: row.highest_cve_epss !== null ? Number(row.highest_cve_epss) : null,
            highest_cve_cvss_v3: row.highest_cve_cvss_v3 !== null ? Number(row.highest_cve_cvss_v3) : null
        }
    });

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