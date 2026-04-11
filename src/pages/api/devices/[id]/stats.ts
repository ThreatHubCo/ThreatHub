import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";
import { getDeviceStats } from "@/lib/repositories/devices";

export default withApiHandler(async (req, res, session) => {
    const { id } = req.query;

    const stats = await getDeviceStats(Number(id));

    const [cveBreakdown] = await pool.execute(`
            SELECT
                COUNT(DISTINCT CASE WHEN v.severity = 'Critical' THEN v.id END) AS total_critical,
                COUNT(DISTINCT CASE WHEN v.severity = 'High' THEN v.id END) AS total_high,
                COUNT(DISTINCT CASE WHEN v.severity = 'Medium' THEN v.id END) AS total_medium,
                COUNT(DISTINCT CASE WHEN v.severity = 'Low' THEN v.id END) AS total_low,
                COUNT(DISTINCT v.id) AS total
            FROM vulnerabilities v
            INNER JOIN device_vulnerabilities dv ON dv.vulnerability_id = v.id
            WHERE dv.device_id = ?
    `, [Number(id)]);

    return res.status(200).json({
        ...stats,
        cveBreakdown
    });
}, {
    methods: ["GET"],
    authRequired: true
});
