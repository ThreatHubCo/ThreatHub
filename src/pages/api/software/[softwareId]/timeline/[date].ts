import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res) => {
    const date = req.query.date as string;
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

    if (!date) {
        return res.status(400).json({ error: "Missing date" });
    }

    const sql = `
    WITH all_vulns AS (
        -- Active
        SELECT 
            dv.device_id,
            d.dns_name,
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

        -- History
        SELECT 
            dvh.device_id,
            d.dns_name,
            dvh.customer_id,
            dvh.detected_at,
            dvh.resolved_at
        FROM device_vulnerabilities_history dvh
        INNER JOIN devices d ON d.id = dvh.device_id
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
    ),

    device_state AS (
        SELECT
            device_id,
            ANY_VALUE(dns_name) AS dns_name,

            -- still vulnerable on the day?
            SUM(
                CASE 
                    WHEN DATE(detected_at) <= ?
                    AND (resolved_at IS NULL OR DATE(resolved_at) > ?)
                    THEN 1 ELSE 0
                END
            ) AS active_count,

            -- had something resolved on the day?
            SUM(
                CASE 
                    WHEN resolved_at IS NOT NULL
                    AND DATE(resolved_at) = ?
                    THEN 1 ELSE 0
                END
            ) AS resolved_today

        FROM all_vulns
        GROUP BY device_id
    )

    -- Vulnerable devices
    SELECT
        'vulnerable' AS type,
        device_id,
        dns_name
    FROM device_state
    WHERE active_count > 0

    UNION ALL

    -- Resolved devices 
    SELECT
        'resolved' AS type,
        device_id,
        dns_name
    FROM device_state
    WHERE active_count = 0
    AND resolved_today > 0
    `;

    const params = [
        softwareId,
        severityRank,
        ...(customerNum ? [customerNum] : []),

        softwareId,
        severityRank,
        ...(customerNum ? [customerNum] : []),

        date,
        date,
        date
    ];

    try {
        const [rows] = await pool.query(sql, params);

        return res.status(200).json({
            date,
            data: rows
        });

    } catch (e: any) {
        console.error("Failed drilldown query", e);
        return res.status(500).json({ error: "Failed to fetch devices" });
    }
}, {
    methods: ["GET"],
    authRequired: true
});