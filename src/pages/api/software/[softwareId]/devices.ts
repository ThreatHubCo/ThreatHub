import { withApiHandler } from "@/lib/api";
import { getDevicesForSoftwareSummary } from "@/lib/repositories/devices";

interface GetDevicesForSoftwareQuery {
    softwareId?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    dns_name?: string;
    machine_id?: string;
    os_platform?: string;
    is_aad_joined?: string;
    total_vulnerabilities?: string;
    customer?: string;
}

const sortableColumns = new Set<string>([
    "device_id",
    "machine_id",
    "dns_name",
    "os_platform",
    "os_version",
    "os_build",
    "os_processor",
    "os_architecture",
    "risk_score",
    "managed_by",
    "is_aad_joined",
    "first_seen_at",
    "last_seen_at",
    "total_notes",
    "total_vulnerabilities"
]);

export default withApiHandler(async (req, res) => {
    const query = req.query as GetDevicesForSoftwareQuery;
    const softwareId = Number(query.softwareId);

    if (!softwareId) {
        return res.status(400).json({ error: "Missing software identifier" });
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));

    const sortBy = sortableColumns.has(query.sortBy) ? query.sortBy : "d.last_seen_at";
    const sortDir = query.sortDir === "asc" ? "asc" : "desc";

    const customerNum = query.customer ? Number(query.customer) : undefined;

    const filters = {
        dns_name: query.dns_name,
        machine_id: query.machine_id,
        os_platform: query.os_platform,
        is_aad_joined: query.is_aad_joined,
        total_vulnerabilities: query.total_vulnerabilities,
        customer: customerNum
    };

    const data = await getDevicesForSoftwareSummary(
        softwareId,
        filters.customer,
        filters.dns_name,
        filters.machine_id,
        filters.os_platform,
        filters.is_aad_joined,
        filters.total_vulnerabilities,
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