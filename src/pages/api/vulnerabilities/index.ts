import { withApiHandler } from "@/lib/api";
import { getVulnerabilities } from "@/lib/repositories/vulnerabilities";

export default withApiHandler(async (req, res, session) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const sortBy = req.query.sortBy as string;
    const sortDir = (req.query.sortDir as "asc" | "desc") || "desc";

    const data = await getVulnerabilities(
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
        sortBy,
        sortDir,
        page,
        pageSize
    );

    return res.status(200).json(data);
}, {
    methods: ["GET"],
    authRequired: true
});