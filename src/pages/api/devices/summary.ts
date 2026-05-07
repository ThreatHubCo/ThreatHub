import { withApiHandler } from "@/lib/api";
import { getDevicesGlobalSummary } from "@/lib/repositories/devices";

const sortableColumns = new Set<string>([
    "device_id",
    "dns_name",
    "customer_name",
    "os_platform",
    "os_version",
    "os_build",
    "os_architecture",
    "risk_level",
    "managed_by",
    "is_aad_joined",
    "first_seen_at",
    "last_seen_at",
    "total_notes",
    "total_vulnerabilities",
    "total_high_vulnerabilities",
    "total_critical_vulnerabilities",
    "total_affected_software"
]);

export default withApiHandler(async (req, res) => {
    const query = req.query as any;

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));

    const sortBy = sortableColumns.has(query.sortBy) ? query.sortBy : "d.last_seen_at";
    const sortDir = query.sortDir === "asc" ? "asc" : "desc";

    const data = await getDevicesGlobalSummary(
        query.dns_name,
        query.machine_id,
        query.os_platform,
        query.os_build,
        query.os_processor,
        query.os_architecture,
        query.risk_score,
        query.managed_by,
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
        rows: data.devices.map(device => ({ id: device.device_id, ...device })),
        meta: {
            totalItems: data.totalItems,
            totalPages: data.totalPages,
            totalStaleDevices: data.totalStaleDevices,
            totalStaleDevices60Days: data.totalStaleDevices60Days,
            totalNotEntraJoined: data.totalNotEntraJoined
        }
    });
}, {
    methods: ["GET"],
    authRequired: true
});