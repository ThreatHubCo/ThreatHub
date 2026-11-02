import { AgentPermission, hasPermission } from "@/lib/agents/permissions";
import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res, session) => {
    const canViewHiddenReports = hasPermission(session, AgentPermission.REPORT_VIEW_HIDDEN);

    const [rows] = await pool.execute(
        `SELECT
            reports.id,
            reports.created_at,
            reports.updated_at,
            reports.name,
            reports.description,
            reports.is_public,
            reports.created_by_agent_id,
            agents.display_name AS created_by_agent_name
        FROM reports
        LEFT JOIN agents ON reports.created_by_agent_id = agents.id
        ${canViewHiddenReports ? "" : "WHERE reports.is_public = 1"}
        `, []
    );

    return res.json(rows);
}, {
    methods: ["GET"],
    requiredPermissions: [AgentPermission.REPORT_VIEW_TAB]
});