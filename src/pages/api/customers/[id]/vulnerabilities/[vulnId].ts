import { withApiHandler } from "@/lib/api";
import { getCustomerVulnerabilityFull } from "@/lib/repositories/vulnerabilities";

export default withApiHandler(async (req, res, session) => {
    const { id, vulnId } = req.query;

    if (!vulnId) {
        return res.status(400).json({ error: "Missing vulnerability identifier" });
    }
     if (!id) {
        return res.status(400).json({ error: "Missing customer identifier" });
    }

    const vuln = await getCustomerVulnerabilityFull(Number(id), isNaN(Number(vulnId)) ? String(vulnId) : Number(vulnId));

    if (!vuln) {
        return res.status(404).json({ error: "Vulnerability not found" });
    }
    return res.status(200).json(vuln);
}, {
    methods: ["GET"],
    authRequired: true
});
