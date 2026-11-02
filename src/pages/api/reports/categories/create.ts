import { AgentPermission } from "@/lib/agents/permissions";
import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";
import Joi from "joi";

const schema = Joi.object({
    name: Joi.string().trim().max(255).required(),
    description: Joi.string().allow("", null).optional()
});

export default withApiHandler(async (req, res) => {
    const [result] = await pool.execute(`INSERT INTO report_categories (name, description) VALUES (?, ?)`, [
        req.body.name,
        req.body.description || null
    ]);

    res.status(201).end();
}, {
    schema,
    methods: ["POST"],
    requiredPermissions: [AgentPermission.REPORT_CATEGORY_CREATE]
});