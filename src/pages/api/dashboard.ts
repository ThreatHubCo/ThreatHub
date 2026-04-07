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
            COUNT(*) AS cve_count,
            SUM(v.severity = 'Critical') AS critical_count
        FROM vulnerability_affected_software vas
        JOIN vulnerabilities v ON v.id = vas.vulnerability_id
        JOIN software s ON s.id = vas.software_id
        GROUP BY s.id
        ORDER BY critical_count DESC, cve_count DESC
        LIMIT 5
    `);

    const [topCves] = await pool.execute(`
        SELECT
            id,
            cve_id,
            name,
            severity,
            cvss_v3,
            epss
        FROM vulnerabilities
        ORDER BY
            FIELD(severity,'Critical','High','Medium','Low'),
            epss DESC,
            cvss_v3 DESC
        LIMIT 5
    `);

    const [recentLogs] = await pool.execute("SELECT * FROM backend_logs WHERE level IN ('ERROR') ORDER BY created_at DESC LIMIT 20");

    res.status(200).json({
        topDevices,
        topSoftware,
        topCves,
        recentLogs
    });

}, {
    methods: ["GET"],
    authRequired: true,
    requiredRole: AgentRole.VIEWER
});