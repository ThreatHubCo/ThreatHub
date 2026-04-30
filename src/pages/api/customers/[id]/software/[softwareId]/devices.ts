import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res, session) => {
    const { id, softwareId } = req.query;

    if (!softwareId) {
        return res.status(400).json({ error: "Missing software identifier" });
    }
    if (!id) {
        return res.status(400).json({ error: "Missing customer identifier" });
    }

    const sql = `
        SELECT DISTINCT 
            d.dns_name, 
            d.id, 
            d.os_platform, 
            d.os_version, 
            d.machine_id
        FROM devices d
        INNER JOIN device_vulnerabilities dv ON dv.device_id = d.id
        WHERE dv.software_id = ? 
        AND d.customer_id = ?
        AND (dv.status = 'OPEN' OR dv.status = 'RE_OPENED')
        ORDER BY d.dns_name
    `;

    const [rows] = await pool.query(sql, [Number(softwareId), Number(id)]);
    return res.status(200).json(rows);
}, {
    methods: ["GET"],
    authRequired: true
});
