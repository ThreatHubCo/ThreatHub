import { withApiHandler } from "@/lib/api";
import { AgentRole } from "@/lib/entities/Agent";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res) => {
    const [topDevices] = await pool.execute(`
        SELECT 
            d.id,
            d.dns_name,
            d.os_platform,
            COUNT(*) AS critical_cve_count
        FROM device_vulnerabilities dv
        INNER JOIN vulnerabilities v ON v.id = dv.vulnerability_id
        INNER JOIN devices d ON d.id = dv.device_id
        WHERE v.severity = 'Critical'
        GROUP BY d.id
        ORDER BY critical_cve_count DESC
        LIMIT 5
    `);

    const [topSoftware] = await pool.execute(`
        SELECT 
            s.id,
            COALESCE(s.formatted_name, s.name) AS name,
            COALESCE(s.formatted_vendor, s.vendor) AS vendor,
            COUNT(DISTINCT dv.vulnerability_id) AS cve_count,
            COUNT(DISTINCT CASE WHEN v.severity = 'Critical' THEN dv.vulnerability_id END) AS critical_count
        FROM device_vulnerabilities dv
        INNER JOIN software s ON s.id = dv.software_id
        INNER JOIN vulnerabilities v ON v.id = dv.vulnerability_id
        WHERE dv.status IN ('OPEN', 'RE_OPENED')
        GROUP BY s.id
        ORDER BY critical_count DESC, cve_count DESC
        LIMIT 5
    `);

    const [cveBreakdown] = await pool.execute(`
        SELECT
            COUNT(DISTINCT CASE WHEN v.severity = 'Critical' THEN v.id END) AS total_critical,
            COUNT(DISTINCT CASE WHEN v.severity = 'High' THEN v.id END) AS total_high,
            COUNT(DISTINCT CASE WHEN v.severity = 'Medium' THEN v.id END) AS total_medium,
            COUNT(DISTINCT CASE WHEN v.severity = 'Low' THEN v.id END) AS total_low,
            COUNT(DISTINCT v.id) AS total
        FROM vulnerabilities v
        INNER JOIN device_vulnerabilities dv ON dv.vulnerability_id = v.id
    `);

    const [osBreakdown] = await pool.execute(`
        SELECT 
            d.os_platform,
            COUNT(DISTINCT d.id) AS total_devices,
            COUNT(DISTINCT dv.device_id) AS vulnerable_devices
        FROM devices d
        LEFT JOIN device_vulnerabilities dv ON dv.device_id = d.id
        GROUP BY d.os_platform
        ORDER BY total_devices DESC
    `);

    const [recentLogs] = await pool.execute("SELECT * FROM backend_logs WHERE level IN ('ERROR') ORDER BY created_at DESC LIMIT 20");

    res.status(200).json({
        cveBreakdown,
        osBreakdown,
        topDevices,
        topSoftware,
        recentLogs
    });

}, {
    methods: ["GET"],
    authRequired: true,
    requiredRole: AgentRole.VIEWER
});