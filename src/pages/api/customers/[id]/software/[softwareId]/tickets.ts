import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res, session) => {
    const { id, softwareId } = req.query;

    if (!softwareId) {
        return res.status(400).json({ error: "Missing software identifier" });
    }
    if (!id) {
        return res.status(400).json({ error: "Missing customer identifier" });
    }

    const sql = `
        SELECT
            rt.software_id,
            rt.id,
            rt.external_ticket_id,
            rt.status,
            rt.created_at,
            rt.last_ticket_update_at,
            rt.last_sync_at,
            rt.notes,
            rt.opened_by_agent_id,
            agents.display_name AS opened_by_agent_name
        FROM remediation_tickets rt
        LEFT JOIN agents ON agents.id = rt.opened_by_agent_id
        WHERE rt.customer_id = ?
            AND rt.software_id = ?
            AND rt.status IN ('OPEN', 'CLOSED_GRACE_PERIOD')
    `;
    
    const [rows] = await pool.query(sql, [Number(id), Number(softwareId)]);
    return res.status(200).json(rows);
}, {
    methods: ["GET"],
    authRequired: true
});
