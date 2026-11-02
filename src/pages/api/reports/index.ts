import { AgentPermission, hasPermission } from "@/lib/agents/permissions";
import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res, session) => {
    const canViewHiddenReports = hasPermission(session, AgentPermission.REPORT_VIEW_HIDDEN);

    const [rows] = await pool.execute(`
        SELECT
            reports.id,
            reports.created_at,
            reports.updated_at,
            reports.name,
            reports.description,
            reports.is_public,
            reports.created_by_agent_id,
            agents.display_name AS created_by_agent_name,
            reports.category_id,
            report_categories.name AS category_name,
            report_categories.description AS category_description
        FROM reports
        LEFT JOIN agents ON reports.created_by_agent_id = agents.id
        LEFT JOIN report_categories ON reports.category_id = report_categories.id
        ${canViewHiddenReports ? "" : "WHERE reports.is_public = 1"}
        ORDER BY report_categories.name ASC, reports.name ASC
    `, []);

    return res.json(rows);
}, {
    methods: ["GET"],
    requiredPermissions: [AgentPermission.REPORT_VIEW_TAB]
});