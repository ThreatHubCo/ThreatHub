import { AgentPermission } from "@/lib/agents/permissions";
import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res) => {
    const [rows] = await pool.execute(`
        SELECT
            id,
            created_at,
            updated_at,
            name,
            description
        FROM report_categories
        ORDER BY name ASC
    `);
    return res.json(rows);
}, {
    methods: ["GET"],
    requiredPermissions: [AgentPermission.REPORT_CATEGORY_VIEW_TAB]
});