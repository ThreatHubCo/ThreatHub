import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res, session) => {

    const [rows] = await pool.query(`
        SELECT
            COUNT(*) AS total_tickets,

            SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) AS open_tickets,
            SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) AS closed_tickets,
            SUM(CASE WHEN status = 'CLOSED_GRACE_PERIOD' THEN 1 ELSE 0 END) AS closed_grace_period_tickets,

            SUM(
                CASE 
                    WHEN last_ticket_update_at < (UTC_TIMESTAMP() - INTERVAL 7 DAY)
                    AND status = 'OPEN'
                    THEN 1 ELSE 0 
                END
            ) AS stale_tickets

        FROM remediation_tickets
    `);

    const stats = rows[0];

    return res.status(200).json({
        totalTickets: stats.total_tickets,
        openTickets: stats.open_tickets,
        closedTickets: stats.closed_tickets,
        closedGracePeriodTickets: stats.closed_grace_period_tickets,
        staleTickets: stats.stale_tickets
    });
}, {
    methods: ["GET"],
    authRequired: true
});