import { withApiHandler } from "@/lib/api";
import { AgentRole } from "@/lib/entities/Agent";
import { getAuditLogs } from "@/lib/repositories/auditLogs";
import { BackendLog } from "@/lib/entities/BackendLog";

interface GetAuditLogsQuery {
    page?: string;
    pageSize?: string;
    sortBy?: keyof BackendLog;
    sortDir?: "asc" | "desc";
    agent_name?: string;
    customer_name?: string;
    action?: string;
    from_date?: string;
    to_date?: string;
}

const sortableColumns: Set<keyof BackendLog> = new Set([
    "id",
    "created_at",
    "level",
    "source",
    "customer_id",
    "customer_name"
]);

export default withApiHandler(async (req, res, session) => {
    const query = req.query as GetAuditLogsQuery;
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));

    const sortBy = sortableColumns.has(query.sortBy) ? query.sortBy : "audit_logs.created_at";
    const sortDir = query.sortDir === "asc" ? "asc" : "desc";

    const logs = await getAuditLogs(
        query.agent_name,
        query.customer_name,
        query.action,
        query.from_date,
        query.to_date,
        sortBy,
        sortDir,
        page,
        pageSize
    );

    return res.status(200).json({
        rows: logs.logs,
        meta: {
            totalItems: logs.totalItems,
            totalPages: logs.totalPages
        }
    });
}, {
    methods: ["GET"],
    authRequired: true,
    requiredRole: AgentRole.ADMIN
});