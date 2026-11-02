import { AgentPermission } from "@/lib/agents/permissions";
import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";
import Joi from "joi";

const schema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
        "any.required": "Category name is required",
        "string.min": "Category name must be at least 2 characters",
        "string.max": "Category name must be at most 100 characters"
    }),
    description: Joi.string().allow("").optional()
});

export default withApiHandler(async (req, res) => {
    const id = Number(req.query.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid category ID" });
    }

    if (req.method === "PUT") {
        const { error } = schema.validate(req.body);

        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { name, description } = req.body;

        const [existing]: any = await pool.execute("SELECT id FROM report_categories WHERE id = ?", [id]);

        if (!existing || existing.length === 0) {
            return res.status(404).json({ error: "Report category not found" });
        }

        await pool.execute(`
            UPDATE report_categories SET name = ?, description = ? WHERE id = ?`,
            [name, description || null, id]
        );

        return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
        const [existing]: any = await pool.execute("SELECT id FROM report_categories WHERE id = ?", [id]);

        if (!existing || existing.length === 0) {
            return res.status(404).json({ error: "Report category not found" });
        }

        await pool.execute("DELETE FROM report_categories WHERE id = ?", [id]);

        return res.status(200).json({ success: true });
    }
}, {
    methods: ["PUT", "DELETE"],
    requiredPermissions: {
        "PUT": [AgentPermission.REPORT_CATEGORY_EDIT],
        "DELETE": [AgentPermission.REPORT_CATEGORY_DELETE]
    }
});