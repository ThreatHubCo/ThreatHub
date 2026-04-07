import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res, session) => {
    const { softwareId } = req.query;

    if (!softwareId) {
        return res.status(400).json({ error: "Missing software identifier" });
    }

    const sql = `
        SELECT DISTINCT d.dns_name, d.id, d.os_platform, d.os_version, d.machine_id, d.id
        FROM devices d
        INNER JOIN device_vulnerabilities dv ON dv.device_id = d.id
        INNER JOIN vulnerability_affected_software vas ON vas.vulnerability_id = dv.vulnerability_id
        WHERE vas.software_id = ?
        ORDER BY d.dns_name
    `;

    const [rows] = await pool.query(sql, [Number(softwareId)]);
    return res.status(200).json(rows);
}, {
    methods: ["GET"],
    authRequired: true
});
