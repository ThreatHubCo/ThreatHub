import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res, session) => {
    const { softwareId } = req.query;

    if (!softwareId) {
        return res.status(400).json({ error: "Missing software identifier" });
    }

    const sql = `
        SELECT 
            c.id, 
            c.name, 
            c.tenant_id, 
            c.supports_csp
        FROM customers c
        INNER JOIN device_vulnerabilities dv ON dv.customer_id = c.id
        WHERE dv.software_id = ? 
        AND dv.status IN ('OPEN', 'RE_OPENED')
        AND c.deleted_at IS NULL
        GROUP BY c.id
        ORDER BY c.name
    `;

    const [rows] = await pool.query(sql, [Number(softwareId)]);
    const result = (rows as any[]).map(row => {

        return row;
    });

    return res.status(200).json(result);
}, {
    methods: ["GET"],
    authRequired: true
});