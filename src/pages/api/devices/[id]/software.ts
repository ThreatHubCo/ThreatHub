import { withApiHandler } from "@/lib/api";
import { getDeviceAffectedSoftware } from "@/lib/repositories/devices";

interface GetDeviceAffectedSoftwareQuery {
    id?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    name?: string;
    vendor?: string;
}

const sortableColumns = new Set<string>([
    "id",
    "name",
    "defender_name",
    "vendor",
    "public_exploit",
    "vulnerabilities_count",
    "highest_cve_severity",
    "highest_cve_epss",
    "highest_cve_cvss_v3"
]);

export default withApiHandler(async (req, res, session) => {
    const query = req.query as GetDeviceAffectedSoftwareQuery;
    const deviceId = Number(query.id);

    if (!deviceId) {
        return res.status(400).json({ error: "Missing device identifier" });
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));

    const sortBy = sortableColumns.has(query.sortBy) ? query.sortBy : "vulnerabilities_count";
    const sortDir = query.sortDir === "asc" ? "asc" : "desc";

    const data = await getDeviceAffectedSoftware(
        deviceId,
        query.name,
        query.vendor,
        sortBy,
        sortDir,
        page,
        pageSize
    );

    return res.status(200).json({
        software: data.software.map(row => ({
            ...row,
            highest_cve_epss: row.highest_cve_epss !== null ? Number(row.highest_cve_epss) : null,
            highest_cve_cvss_v3: row.highest_cve_cvss_v3 !== null ? Number(row.highest_cve_cvss_v3) : null
        })),
        totalItems: data.totalItems,
        totalPages: data.totalPages
    });
}, {
    methods: ["GET"],
    authRequired: true
});