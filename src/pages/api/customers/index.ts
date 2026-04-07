import { withApiHandler } from "@/lib/api";
import { Customer } from "@/lib/entities/Customer";
import { getAllCustomers } from "@/lib/repositories/customers";

interface GetCustomersQuery {
    page?: string;
    pageSize?: string;
    sortBy?: keyof Customer;
    sortDir?: "asc" | "desc";
    name?: string;
    tenant_id?: string;
    enabled?: string;
}

const sortableColumns: Set<keyof Customer> = new Set([
    "id",
    "created_at",
    "updated_at",
    "deleted_at",
    "name",
    "tenant_id",
    "external_customer_id",
    "supports_csp"
]);

export default withApiHandler(async (req, res, session) => {
    const query = req.query as GetCustomersQuery;
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));

    const sortBy = sortableColumns.has(query.sortBy as keyof Customer) ? query.sortBy : "customers.created_at";
    const sortDir = query.sortDir === "asc" ? "asc" : "desc";

    const data = await getAllCustomers(
        query.name,
        query.tenant_id,
        query.enabled,
        sortBy,
        sortDir,
        page,
        pageSize
    );

    return res.status(200).json({
        customers: data.customers,
        totalItems: data.totalItems,
        totalPages: data.totalPages,
        totalDisabledItems: data.totalDisabledItems
    });
}, {
    methods: ["GET"],
    authRequired: true
});