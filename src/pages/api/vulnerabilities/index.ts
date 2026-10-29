import { withApiHandler } from "@/lib/api";
import { getVulnerabilities, getVulnerabilities2 } from "@/lib/repositories/vulnerabilities";

const SORT_MAP: Record<string, string> = {
    published_at: "v.published_at",
    severity: "v.severity",
    public_exploit: "v.public_exploit",
    exploit_verified: "v.exploit_verified",
    cve_id: "v.cve_id",
    id: "v.id",
    cvss_v3: "v.cvss_v3",
    epss: "v.epss",
    total_affected_clients: "cv_count",
    total_affected_software: "vas_count",
    total_affected_devices: "dv_count",
    total_open_tickets: "rt_count"
}

export default withApiHandler(async (req, res, session) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const sortBy = req.query.sortBy as string;
    const sortDir = (req.query.sortDir as "asc" | "desc") || "desc";

    const params: any[] = [
        {
            cveId: req.query.cve_id as string,
            severity: req.query.severity as string,
            softwareName: req.query.softwareName as string,
            clientName: req.query.clientName as string,
            hasAffectedClients: req.query.hasAffectedClients ? req.query.hasAffectedClients === "true" : undefined,
            publicExploit: req.query.public_exploit as string,
            exploitVerified: req.query.exploit_verified as string,
            epss: req.query.epss as string,
            total_affected_clients: req.query.total_affected_clients as string,
            total_affected_software: req.query.total_affected_software as string,
            total_affected_devices: req.query.total_affected_devices as string
        },
        sortBy && SORT_MAP[sortBy] ? SORT_MAP[sortBy] : "v.published_at",
        sortDir,
        page,
        pageSize
    ];

    const data = Boolean(req.query.hasAffectedClients) ? await getVulnerabilities(...params) : await getVulnerabilities2(...params);

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