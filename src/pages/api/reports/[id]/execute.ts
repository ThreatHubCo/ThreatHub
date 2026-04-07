import { withApiHandler } from "@/lib/api";
import { AgentRole } from "@/lib/entities/Agent";
import { AuditAction } from "@/lib/entities/AuditLog";
import { ExecuteReportAuditDetailsV1 } from "@/lib/entities/AuditLogDetails";
import { pool, reportPool } from "@/lib/mysql";
import { createAuditLog } from "@/lib/repositories/auditLogs";

export default withApiHandler(async (req, res, session) => {
    const id = Number(req.query.id);

    const [rows]: any[] = await pool.execute("SELECT name, description, is_public, sql_query FROM reports WHERE id = ?", [Number(id)]);

    if (!rows || rows.length === 0) {
        return res.status(404).json({ error: "Report not found" });
    }
    try {
        const [reportRows] = await reportPool.execute(rows[0].sql_query);

        await createAuditLog<ExecuteReportAuditDetailsV1>({
            agent_id: session.agent.id,
            action: AuditAction.EXECUTE_REPORT,
            row_id: Number(id),
            details_version: 1,
            details: {
                name: rows[0].name,
                description: rows[0].description || "",
                is_public: rows[0].is_public
            }
        });

        res.status(200).json({ rows: reportRows });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}, {
    methods: ["POST"],
    requiredRole: AgentRole.VIEWER
});