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
    SELECT CURDATE() - INTERVAL ${Number(startOffset)} DAY AS day
    UNION ALL
    SELECT day + INTERVAL 1 DAY
    FROM dates
    WHERE day < CURDATE() - INTERVAL ${Number(endOffset)} DAY
),

software_vulns AS (
    SELECT v.id
    FROM vulnerabilities v
    JOIN vulnerability_affected_software vas 
        ON vas.vulnerability_id = v.id
    WHERE vas.software_id = ?
    AND (
        CASE v.severity
            WHEN 'Low' THEN 1
            WHEN 'Medium' THEN 2
            WHEN 'High' THEN 3
            WHEN 'Critical' THEN 4
        END
    ) >= ?
),

all_vulns AS (
    SELECT 
        dv.device_id,
        d.customer_id,
        dv.vulnerability_id,
        dv.detected_at,
        NULL as resolved_at
    FROM device_vulnerabilities dv
    INNER JOIN devices d ON d.id = dv.device_id
    INNER JOIN software_vulns sv ON sv.id = dv.vulnerability_id

    UNION ALL

    SELECT 
        device_id,
        customer_id,
        vulnerability_id,
        detected_at,
        resolved_at
    FROM device_vulnerabilities_history dvh
    INNER JOIN software_vulns sv ON sv.id = dvh.vulnerability_id
)

SELECT
    dt.day,

    COUNT(DISTINCT CASE
        WHEN v.detected_at <= dt.day
        AND (v.resolved_at IS NULL OR DATE(v.resolved_at) > dt.day)
        THEN v.device_id
    END) AS total_vulnerable_devices,

    COUNT(DISTINCT CASE
        WHEN DATE(v.resolved_at) = dt.day
        THEN v.device_id
    END) AS resolved_devices_today

FROM dates dt
LEFT JOIN all_vulns v ON 1=1
${customerNum ? "AND v.customer_id = ?" : ""}

GROUP BY dt.day
ORDER BY dt.day
`;

    const params = [
        softwareId,
        severityRank,
        ...(customerNum ? [customerNum] : [])
    ];

    // speed up
    // https://chatgpt.com/c/69b00b76-4744-832b-af87-9b86d7fa5360

    try {
        const [rows] = await pool.query(sql, params);

        return res.status(200).json({
            range,
            offset,
            data: rows
        });

    } catch (error) {
        console.error("Failed timeline query:", error);
        return res.status(500).json({
            error: "Failed to fetch timeline"
        });
    }

}, {
    methods: ["GET"],
    authRequired: true
});