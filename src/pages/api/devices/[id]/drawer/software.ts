import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Missing device identifier" });
    }

    const sql = `
        SELECT
            s.id,
            s.name,
            s.vendor,
            s.notes,
            GROUP_CONCAT(DISTINCT vas.vulnerable_versions ORDER BY vas.vulnerable_versions SEPARATOR ', ') AS vulnerable_versions
        FROM device_vulnerabilities dv
        INNER JOIN software s ON s.id = dv.software_id
        LEFT JOIN vulnerability_affected_software vas 
            ON vas.vulnerability_id = dv.vulnerability_id
            AND vas.software_id = dv.software_id
        WHERE dv.device_id = ? 
        AND dv.status IN ('OPEN', 'RE_OPENED')
        GROUP BY s.id, s.name, s.vendor, s.notes
        ORDER BY s.vendor, s.name;
    `;

    const [rows] = await pool.query(sql, [Number(id)]);
    return res.status(200).json(rows);
}, {
    methods: ["GET"],
    authRequired: true
});
