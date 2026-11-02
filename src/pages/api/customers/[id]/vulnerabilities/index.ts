import { AgentPermission } from "@/lib/agents/permissions";
import { withApiHandler } from "@/lib/api";
import { getCustomerVulnerabilities } from "@/lib/repositories/vulnerabilities";

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

export default withApiHandler(async (req, res, session) => {
    const query = req.query as any;
    const customerId = Number(query.id);
    
    if (!customerId) {
        return res.status(400).json({ error: "Missing customer identifier" });
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));

    const sortBy = sortableColumns.has(query.sortBy) ? query.sortBy : "v.published_at";
    const sortDir = query.sortDir === "asc" ? "asc" : "desc";

    const data = await getCustomerVulnerabilities(
        customerId,
        {
            cveId: query.cve_id,
            severity: query.severity,
            epss: query.epss,
            publicExploit: query.public_exploit,
            exploitVerified: query.exploit_verified,
            total_affected_software: query.total_affected_software,
            total_affected_devices: query.total_affected_devices
        },
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
    authRequired: true,
    requiredPermissions: [AgentPermission.CUSTOMER_VIEW_DETAILED_INFO]
});