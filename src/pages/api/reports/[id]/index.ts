import { withApiHandler } from "@/lib/api";
import { AgentRole } from "@/lib/entities/Agent";
import { AuditAction } from "@/lib/entities/AuditLog";
import { CreateReportAuditDetailsV1, UpdateReportAuditDetailsV1 } from "@/lib/entities/AuditLogDetails";
import { pool } from "@/lib/mysql";
import { createAuditLog } from "@/lib/repositories/auditLogs";
import { basicSqlQueryValidation } from "@/lib/utils/utils";
import Joi from "joi";

const updateReportSchema = Joi.object({
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
    })
});

export default withApiHandler(async (req, res, session) => {
    if (req.method === "PUT") {
        const { error } = updateReportSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const id = Number(req.query.id);
        const { name, description, sql_query, is_public } = req.body;

        try {
            basicSqlQueryValidation(sql_query);
        } catch (e) {
            return res.status(400).json({ error: e.message });
        }

        const [old]: any = await pool.execute("SELECT name, description, is_public FROM reports WHERE id = ?", [id]);

        if (!old || old.length === 0) {
            return res.status(404).json({ error: "Report not found" });
        }

        await pool.execute(
            `UPDATE reports SET name = ?, description = ?, sql_query = ?, is_public = ? WHERE id = ?`,
            [name, description || null, sql_query, is_public ? 1 : 0, id]
        );

        await createAuditLog<UpdateReportAuditDetailsV1>({
            agent_id: session.agent.id,
            action: AuditAction.UPDATE_REPORT,
            row_id: id,
            details_version: 1,
            details: {
                before: {
                    name: old[0].name,
                    description: old[0].description,
                    is_public: !!old[0].is_public
                },
                after: {
                    name,
                    description: description || "",
                    is_public
                }
            }
        });

        res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
        const reportId = req.query.id;

        const [old]: any = await pool.execute("SELECT name, description, is_public FROM reports WHERE id = ?", [reportId]);

        if (!old || old.length === 0) {
            return res.status(404).json({ error: "Report not found" });
        }

        await pool.execute(
            `DELETE FROM reports WHERE id = ?`,
            [reportId]
        );

        await createAuditLog<CreateReportAuditDetailsV1>({
            agent_id: session.agent.id,
            action: AuditAction.DELETE_REPORT,
            row_id: Number(reportId),
            details_version: 1,
            details: {
                name: old[0].name,
                description: old[0].description || "",
                is_public: old[0].is_public
            }
        });

        res.status(200).json({ success: true });
    }
}, {
    methods: ["PUT", "DELETE"],
    requiredRole: AgentRole.ADMIN
});