import { withApiHandler } from "@/lib/api";
import { AgentRole } from "@/lib/entities/Agent";
import { getBackendLogs } from "@/lib/repositories/backendLogs";

export default withApiHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const sortBy = req.query.sortBy as string;
    const sortDir = (req.query.sortDir as "asc" | "desc") || "desc";

    const customerName = req.query.customer_name as string | undefined;
    const source = req.query.source as string | undefined;
    const text = req.query.text as string | undefined;
    const level = req.query.level as string | undefined;
    const fromDate = req.query.from_date as string | undefined;
    const toDate = req.query.to_date as string | undefined;

    const data = await getBackendLogs(
        customerName,
        source,
        text,
        level,
        fromDate,
        toDate,
        page,
        pageSize,
        sortBy,
        sortDir
    );

    return res.status(200).json({
        logs: data.logs,
        totalItems: data.totalItems,
        totalPages: data.totalPages
    });
}, {
    methods: ["GET"],
    authRequired: true,
    requiredRole: AgentRole.VIEWER
});