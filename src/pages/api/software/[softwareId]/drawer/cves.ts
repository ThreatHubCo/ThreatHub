import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res, session) => {
    const { softwareId, limit } = req.query;

    if (!softwareId) {
        return res.status(400).json({ error: "Missing software identifier" });
    }

    const sql = `
        SELECT v.*, vas.vulnerable_versions
        FROM vulnerabilities v
        JOIN vulnerability_affected_software vas ON vas.vulnerability_id = v.id
        WHERE vas.software_id = ?
        ORDER BY v.published_at DESC
        ${limit ? "LIMIT ?" : ""}
    `;

    const params = limit ? [Number(softwareId), Number(limit)] : [Number(softwareId)];

    const [rows] = await pool.query(sql, params);
    return res.status(200).json(rows);
}, {
    methods: ["GET"],
    authRequired: true
});
