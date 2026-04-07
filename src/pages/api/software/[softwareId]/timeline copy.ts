import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res) => {
    const range = req.query.range === "month" ? "month" : "week";
    const offset = Number(req.query.offset ?? 0);

    const customerId = req.query.customer as string | undefined;
    const customerNum = customerId ? Number(customerId) : undefined;

    const days = range === "month" ? 30 : 7;
    const startOffset = days * (offset + 1);
    const endOffset = days * offset;

    // Build the query and params dynamically
    const params: any[] = [];
    
    let customerJoinFilter = "";
    if (customerNum) {
        // We filter inside the JOIN to ensure we don't accidentally 
        // filter out the dates themselves from the 'dates' CTE.
        customerJoinFilter = "AND h.customer_id = ?";
        params.push(customerNum);
    }

    const sql = `
        WITH RECURSIVE dates AS (
            SELECT CURDATE() - INTERVAL ${Number(startOffset)} DAY AS day
            UNION ALL
            SELECT day + INTERVAL 1 DAY
            FROM dates
            WHERE day < CURDATE() - INTERVAL ${Number(endOffset)} DAY
        )
        SELECT
            d.day,
            COUNT(DISTINCT h.device_id) AS affected_devices
        FROM dates d
        LEFT JOIN device_vulnerabilities_history h
            ON h.detected_at <= d.day
            AND (h.resolved_at IS NULL OR h.resolved_at >= d.day)
            ${customerJoinFilter}
        GROUP BY d.day
        ORDER BY d.day;
    `;

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