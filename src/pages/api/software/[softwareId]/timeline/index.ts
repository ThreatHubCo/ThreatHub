import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res) => {
    const range = req.query.range === "month" ? "month" : "week";
    const offset = Number(req.query.offset ?? 0);

    const softwareId = Number(req.query.softwareId);
    const severity = (req.query.severity as string | undefined)?.toLowerCase();

    const severityRank = {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4
    }[severity ?? "low"] ?? 1;

    const customerId = req.query.customer as string | undefined;
    const customerNum = customerId ? Number(customerId) : undefined;

    const days = range === "month" ? 30 : 7;
    const startOffset = days * (offset + 1);
    const endOffset = days * offset;

    const sql = `
        WITH RECURSIVE dates AS (
            SELECT CURDATE() - INTERVAL ${startOffset} DAY AS day
            UNION ALL
            SELECT day + INTERVAL 1 DAY
            FROM dates
            WHERE day < CURDATE() - INTERVAL ${endOffset} DAY
        ),

        all_vulns AS (
            -- Active vulnerabilities
            SELECT 
                dv.device_id,
                d.customer_id,
                dv.detected_at,
                NULL AS resolved_at
            FROM device_vulnerabilities dv
            INNER JOIN devices d ON d.id = dv.device_id
            INNER JOIN vulnerabilities v ON v.id = dv.vulnerability_id
            WHERE dv.software_id = ?
            AND (
                CASE v.severity
                    WHEN 'Low' THEN 1
                    WHEN 'Medium' THEN 2
                    WHEN 'High' THEN 3
                    WHEN 'Critical' THEN 4
                END
            ) >= ?
            ${customerNum ? "AND d.customer_id = ?" : ""}

            UNION ALL

            -- Resolved vulnerabilities
            SELECT 
                dvh.device_id,
                dvh.customer_id,
                dvh.detected_at,
                dvh.resolved_at
            FROM device_vulnerabilities_history dvh
            INNER JOIN vulnerabilities v ON v.id = dvh.vulnerability_id
            WHERE dvh.software_id = ?
            AND (
                CASE v.severity
                    WHEN 'Low' THEN 1
                    WHEN 'Medium' THEN 2
                    WHEN 'High' THEN 3
                    WHEN 'Critical' THEN 4
                END
            ) >= ?
            ${customerNum ? "AND dvh.customer_id = ?" : ""}
        )

        SELECT
            dt.day,

            COUNT(DISTINCT CASE
                WHEN DATE(v.detected_at) <= dt.day
                AND (v.resolved_at IS NULL OR DATE(v.resolved_at) > dt.day)
                THEN v.device_id
            END) AS total_vulnerable_devices,

            COUNT(DISTINCT CASE
                WHEN v.resolved_at IS NOT NULL
                AND DATE(v.resolved_at) = dt.day
                THEN v.device_id
            END) AS resolved_devices_today

        FROM dates dt
        LEFT JOIN all_vulns v 
            ON DATE(v.detected_at) <= dt.day

        GROUP BY dt.day
        ORDER BY dt.day
    `;

    const params = [
        softwareId,
        severityRank,
        ...(customerNum ? [customerNum] : []),
        softwareId,
        severityRank,
        ...(customerNum ? [customerNum] : [])
    ];

    try {
        const [rows] = await pool.query(sql, params);

        return res.status(200).json({
            offset,
            data: rows
        });

    } catch (e: any) {
        console.error("Failed timeline query", e);
        return res.status(500).json({ error: "Failed to fetch timeline" });
    }
}, {
    methods: ["GET"],
    authRequired: true
});