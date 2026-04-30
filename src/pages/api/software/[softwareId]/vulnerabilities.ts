import { withApiHandler } from "@/lib/api";
import { getSoftwareVulnerabilities } from "@/lib/repositories/vulnerabilities";

interface GetSoftwareVulnerabilitiesQuery {
    softwareId?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    cve_id?: string;
    severity?: string;
    customer?: string;
}

const sortableColumns = new Set<string>([
    "id",
    "cve_id",
    "severity",
    "cvss_v3",
    "epss",
    "public_exploit",
    "exploit_verified",
    "total_affected_software",
    "total_affected_devices",
    "published_at",
    "updated_at",
    "first_detected_at"
]);

export default withApiHandler(async (req, res) => {
    const query = req.query as GetSoftwareVulnerabilitiesQuery;
    const softwareId = Number(query.softwareId);

    if (!softwareId) {
        return res.status(400).json({ error: "Missing software identifier" });
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));

    const sortBy = sortableColumns.has(query.sortBy) ? query.sortBy : "v.published_at";
    const sortDir = query.sortDir === "asc" ? "asc" : "desc";

    const customerNum = query.customer ? Number(query.customer) : undefined;

    const filters = {
        cveId: query.cve_id,
        severity: query.severity
    }

    const data = await getSoftwareVulnerabilities(
        softwareId,
        customerNum,
        filters,
        sortBy,
        sortDir,
        page,
        pageSize
    );

    return res.status(200).json({
        rows: data.vulnerabilities,
        meta: {
            totalItems: data.totalItems,
            totalPages: data.totalPages
        }
    });
}, {
    methods: ["GET"],
    authRequired: true
});