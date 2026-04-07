import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res, session) => {
    const { softwareId } = req.query;

    if (!softwareId) {
        return res.status(400).json({ error: "Missing software identifier" });
    }

    const sql = `
        SELECT DISTINCT 
            c.id, c.name, c.tenant_id, c.supports_csp,
            GROUP_CONCAT(vas.vulnerable_versions SEPARATOR '|') AS vulnerable_versions
        FROM customers c
        JOIN customer_vulnerabilities cv 
            ON cv.customer_id = c.id
        JOIN vulnerabilities v 
            ON v.id = cv.vulnerability_id
        JOIN vulnerability_affected_software vas 
            ON vas.vulnerability_id = v.id
        WHERE vas.software_id = ?
        GROUP BY c.id
        ORDER BY c.name
    `;

    const [rows] = await pool.query(sql, [Number(softwareId)]);
    const result = (rows as any[]).map(row => {
    const versions = row.vulnerable_versions
        ? [...new Set(row.vulnerable_versions.split("|").map((v: string) => v.trim()).filter(Boolean))]
        : [];

    return {
        ...row,
        vulnerable_versions: versions.join(", ")
    }
});

return res.status(200).json(result);
}, {
    methods: ["GET"],
    authRequired: true
});