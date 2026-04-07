import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res) => {
    const sqlVulns = `
        SELECT d.dns_name, v.status
        FROM device_vulnerabilities v
        INNER JOIN devices d ON v.device_id = d.id
    `;

    const sqlHistory = `
        SELECT d.dns_name, h.auto_resolved, h.resolved_at
        FROM device_vulnerabilities_history h
        INNER JOIN devices d ON h.device_id = d.id
    `;

    try {
        const [vulns] = await pool.query(sqlVulns);
        const [history] = await pool.query(sqlHistory);

        return res.status(200).json({
            vulnerabilities: vulns,
            history: history
        });
    } catch (error) {
        console.error("Failed to fetch device vulnerabilities:", error);
        return res.status(500).json({ error: "Failed to fetch device vulnerabilities" });
    }
}, {
    methods: ["GET"],
    authRequired: true
});