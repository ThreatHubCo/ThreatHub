import { withApiHandler } from "@/lib/api";
import { getDevicesGlobalSummary } from "@/lib/repositories/devices";

interface GetDevicesGlobalSummaryQuery {
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    dns_name?: string;
    machine_id?: string;
    os_platform?: string;
    customer_name?: string;
    is_aad_joined?: string;
    total_vulnerabilities?: string;
    total_affected_software?: string;
}

const sortableColumns = new Set<string>([
    "device_id",
    "dns_name",
    "customer_name",
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
    const query = req.query as GetDevicesGlobalSummaryQuery;

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));

    const sortBy = sortableColumns.has(query.sortBy) ? query.sortBy : "d.last_seen_at";
    const sortDir = query.sortDir === "asc" ? "asc" : "desc";

    const data = await getDevicesGlobalSummary(
        query.dns_name,
        query.machine_id,
        query.os_platform,
        query.customer_name,
        query.is_aad_joined,
        query.total_vulnerabilities,
        query.total_affected_software,
        page,
        pageSize,
        sortBy,
        sortDir
    );

    return res.status(200).json({
        devices: data.devices.map(device => ({ id: device.device_id, ...device })),
        totalItems: data.totalItems,
        totalPages: data.totalPages,
        totalStaleDevices: data.totalStaleDevices,
        totalStaleDevices60Days: data.totalStaleDevices60Days,
        totalNotEntraJoined: data.totalNotEntraJoined
    });
}, {
    methods: ["GET"],
    authRequired: true
});