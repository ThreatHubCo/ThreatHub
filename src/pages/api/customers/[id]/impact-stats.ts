import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res, session) => {
    const { id } = req.query;

    const [topDevices] = await pool.execute(`
            SELECT 
                d.id,
                d.dns_name,
                d.os_platform,
                COUNT(*) AS critical_cve_count
            FROM device_vulnerabilities dv
            INNER JOIN vulnerabilities v ON v.id = dv.vulnerability_id
            INNER JOIN devices d ON d.id = dv.device_id
            WHERE v.severity = 'Critical' AND d.customer_id = ?
            GROUP BY d.id
            ORDER BY critical_cve_count DESC
            LIMIT 5
        `, [Number(id)]);
    
        const [topSoftware] = await pool.execute(`
            SELECT 
                s.id,
                s.name,
                s.vendor,
                COUNT(DISTINCT dv.vulnerability_id) AS cve_count,
                COUNT(
                    DISTINCT CASE
                        WHEN v.severity = 'Critical'
                        THEN dv.vulnerability_id
                    END
                ) AS critical_count

            FROM device_vulnerabilities dv
            INNER JOIN vulnerabilities v ON v.id = dv.vulnerability_id
            INNER JOIN software s ON s.id = dv.software_id
            WHERE dv.customer_id = ?
            GROUP BY s.id, s.name, s.vendor
            ORDER BY critical_count DESC, cve_count DESC
            LIMIT 5
        `,
            [Number(id)]
        );

    return res.status(200).json({
        topSoftware,
        topDevices
    });
}, {
    methods: ["GET"],
    authRequired: true
});
