import { withApiHandler } from "@/lib/api";
import { getDevicesForCustomerSummary } from "@/lib/repositories/devices";

interface GetDevicesQuery {
    id?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    dns_name?: string;
    machine_id?: string;
    os_platform?: string;
    is_aad_joined?: string;
    total_vulnerabilities?: string;
    total_affected_software?: string;
}

const sortableColumns = new Set<string>([
    "device_id",
    "dns_name",
    "os_platform",
    "os_version",
    "is_aad_joined",
    "last_seen_at",
    "total_notes",
    "total_vulnerabilities",
    "total_high_vulnerabilities",
    "total_critical_vulnerabilities",
    "total_affected_software"
]);

export default withApiHandler(async (req, res) => {
    const query = req.query as GetDevicesQuery;
    const customerId = Number(query.id);

    if (!customerId) {
        return res.status(400).json({ error: "Missing customer identifier" });
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));

    const sortBy = sortableColumns.has(query.sortBy || "") ? query.sortBy! : "d.last_seen_at";
    const sortDir = query.sortDir === "asc" ? "asc" : "desc";

    const data = await getDevicesForCustomerSummary(
        customerId,
        query.dns_name,
        query.machine_id,
        query.os_platform,
        query.is_aad_joined,
        query.total_vulnerabilities,
        query.total_affected_software,
        page,
        pageSize,
        sortBy,
        sortDir
    );

    return res.status(200).json({
        rows: data.devices,
        meta: {
            totalItems: data.totalItems,
            totalPages: data.totalPages
        }
    });
}, {
    methods: ["GET"],
    authRequired: true
});