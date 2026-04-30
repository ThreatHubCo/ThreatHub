import { withApiHandler } from "@/lib/api";
import { getRemediationTicketsForSoftware } from "@/lib/repositories/remediations";

interface GetRemediationTicketsQuery {
    softwareId?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    status?: string;
    opened_by_agent?: string;
    customer?: string;
    external_ticket_id?: string;
}

const sortableColumns = new Set<string>([
    "external_ticket_id",
    "customer_name",
    "status",
    "opened_by_agent_name",
    "last_ticket_update_at",
    "last_sync_at"
]);

export default withApiHandler(async (req, res) => {
    const query = req.query as GetRemediationTicketsQuery;
    const softwareId = Number(query.softwareId);

    if (!softwareId) {
        return res.status(400).json({ error: "Missing software identifier" });
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));

    const sortBy = sortableColumns.has(query.sortBy) ? query.sortBy : "rt.last_ticket_update_at";
    const sortDir = query.sortDir === "asc" ? "asc" : "desc";

    const customerNum = query.customer ? Number(query.customer) : undefined;

    const filters = {
        status: query.status,
        opened_by_agent: query.opened_by_agent,
        customer: customerNum,
        external_ticket_id: query.external_ticket_id
    };

    const data = await getRemediationTicketsForSoftware(
        softwareId,
        filters.customer,
        filters.status,
        filters.opened_by_agent,
        filters.external_ticket_id,
        page,
        pageSize,
        sortBy,
        sortDir
    );

    return res.status(200).json({
        rows: data.tickets,
        meta: {
            totalItems: data.totalItems,
            totalPages: data.totalPages
        }
    });
}, {
    methods: ["GET"],
    authRequired: true
});