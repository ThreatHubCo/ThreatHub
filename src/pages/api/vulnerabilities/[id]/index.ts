import { getVulnerabilityFull } from "@/lib/repositories/vulnerabilities";
import { withApiHandler } from "@/lib/api";

export default withApiHandler(async (req, res, session) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Missing vulnerability identifier" });
    }

    const vuln = await getVulnerabilityFull(isNaN(Number(id)) ? String(id) : Number(id));

    if (!vuln) {
        return res.status(404).json({ error: "Vulnerability not found" });
    }
    return res.status(200).json(vuln);
}, {
    methods: ["GET"],
    authRequired: true
});
