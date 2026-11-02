import { AgentPermission } from "@/lib/agents/permissions";
import { withApiHandler } from "@/lib/api";
import { AuditAction } from "@/lib/entities/AuditLog";
import { CreateReportAuditDetailsV1 } from "@/lib/entities/AuditLogDetails";
import { pool } from "@/lib/mysql";
import { createAuditLog } from "@/lib/repositories/auditLogs";
import { basicSqlQueryValidation } from "@/lib/utils/utils";
import Joi from "joi";

const reportSchema = Joi.object({
    name: Joi.string().min(2).max(255).required().messages({
        "any.required": "Report name is required",
        "string.min": "Report name must be at least 2 characters",
        "string.max": "Report name must be at most 255 characters"
    }),
    description: Joi.string().allow("").optional(),
    sql_query: Joi.string().min(6).required().messages({
        "any.required": "SQL query is required",
        "string.min": "SQL query must be at least 6 characters"
    }),
    is_public: Joi.boolean().required().messages({
        "any.required": "is_public is required"
    }),
    category_id: Joi.number().integer().optional().allow(null)
});

export default withApiHandler(async (req, res, session) => {
    const { name, description, sql_query, is_public, category_id } = req.body;

    let categoryId: number | null = category_id;

    if (categoryId === undefined || categoryId === null || categoryId === -1) {
        categoryId = null;
    } else {
        const [categories] = await pool.execute(`SELECT id FROM report_categories WHERE id = ? LIMIT 1`, [categoryId]);

        if ((categories as any[]).length === 0) {
            return res.status(400).json({ error: "Invalid report category" });
        }
    }

    try {
        basicSqlQueryValidation(sql_query);
    } catch (e) {
        return res.status(400).json({ error: e.message });
    }

    const [result] = await pool.execute(`
        INSERT INTO reports (created_by_agent_id, name, description, sql_query, is_public, category_id)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            session.agent.id,
            name,
            description || null,
            sql_query,
            is_public ? 1 : 0,
            categoryId
        ]
    );

    const reportId = (result as any).insertId;

    await createAuditLog<CreateReportAuditDetailsV1>({
        agent_id: session.agent.id,
        action: AuditAction.CREATE_REPORT,
        row_id: reportId,
        details_version: 1,
        details: {
            name,
            description: description || "",
            is_public
        }
    });

    res.status(201).json({ success: true });
}, {
    methods: ["POST"],
    schema: reportSchema,
    requiredPermissions: [AgentPermission.REPORT_CREATE]
});