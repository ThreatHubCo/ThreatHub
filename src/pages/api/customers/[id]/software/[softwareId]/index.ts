import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res, session) => {
    const { id, softwareId, limit } = req.query;

    if (!softwareId) {
        return res.status(400).json({ error: "Missing software identifier" });
    }
    if (!id) {
        return res.status(400).json({ error: "Missing customer identifier" });
    }

    const sql = `
        SELECT DISTINCT v.*  FROM vulnerabilities v
        INNER JOIN device_vulnerabilities dv ON dv.vulnerability_id = v.id
        WHERE dv.software_id = ?
            AND dv.customer_id = ?
        ORDER BY v.published_at DESC
        ${limit ? "LIMIT ?" : ""}
    `;

    const params = limit
        ? [Number(softwareId), Number(id), Number(limit)]
        : [Number(softwareId), Number(id)];

    const [rows] = await pool.query(sql, params);
    return res.status(200).json(rows);
}, {
    methods: ["GET"],
    authRequired: true
});
