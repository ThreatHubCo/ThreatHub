import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res, session) => {
    const { id, limit } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Missing device identifier" });
    }

    const sql = `
        SELECT v.*
        FROM vulnerabilities v
        INNER JOIN device_vulnerabilities dv ON dv.vulnerability_id = v.id
        WHERE dv.device_id = ? AND dv.status IN ('OPEN', 'RE_OPENED')
        ORDER BY v.published_at DESC
    `;

    const params = limit ? [Number(id), Number(limit)] : [Number(id)];

    const [rows] = await pool.query(sql, params);
    return res.status(200).json(rows);
}, {
    methods: ["GET"],
    authRequired: true
});
