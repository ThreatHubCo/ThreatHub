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

const sortableColumns = new Set<string>([
    "customers.id",
    "customers.created_at",
    "customers.updated_at",
    "customers.deleted_at",
    "customers.name",
    "customers.tenant_id",
    "customers.external_customer_id",
    "customers.supports_csp",
    "total_devices",
    "total_cves",
    "total_critical_cves"
]);

export default withApiHandler(async (req, res, session) => {
    const query = req.query as GetCustomersQuery;
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));

    const sortBy = sortableColumns.has(query.sortBy as keyof Customer) ? query.sortBy : "customers.name";
    const sortDir = query.sortDir === "desc" ? "desc" : "asc";

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
        rows: data.customers,
        meta: {
            totalItems: data.totalItems,
            totalPages: data.totalPages,
            totalDisabledItems: data.totalDisabledItems
        }
    });
}, {
    methods: ["GET"],
    authRequired: true
});