import { withApiHandler } from "@/lib/api";
import { Agent } from "@/lib/entities/Agent";
import { getAllAgents } from "@/lib/repositories/agents";

interface GetAgentsQuery {
    page?: string;
    pageSize?: string;
    sortBy?: keyof Agent;
    sortDir?: "asc" | "desc";
    display_name?: string;
    email?: string;
    role?: string;
    enabled?: "true" | "false";
};

const sortableColumns: Set<keyof Agent> = new Set([
    "id",
    "created_at",
    "updated_at",
    "deleted_at",
    "email",
    "display_name",
    "entra_object_id",
    "role"
]);

export default withApiHandler(async (req, res, session) => {
    const query = req.query as GetAgentsQuery;
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));

    const sortBy = sortableColumns.has(query.sortBy) ? query.sortBy : "agents.created_at";

    const data = await getAllAgents(
        query.display_name,
        query.email,
        query.role,
        query.enabled,
        sortBy,
        query.sortDir,
        page,
        pageSize
    );

    return res.status(200).json({
        agents: data.agents.map(agent => {
            const { password, ...safeAgent } = agent;

            return {
                ...safeAgent,
                has_password: !!password
            }
        }),
        totalItems: data.totalItems,
        totalPages: data.totalPages
    });
}, {
    methods: ["GET"],
    authRequired: true
});