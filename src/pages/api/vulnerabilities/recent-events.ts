import { withApiHandler } from "@/lib/api";
import { getVulnerabilityEvents } from "@/lib/repositories/vulnerabilities";

export default withApiHandler(async (req, res, session) => {
    const { days, customerId, vulnerabilityId } = req.query;

    // TODO: THIS IS BROKEN
    // const recentEvents = await getVulnerabilityEvents({
    //     days: days ? Number(days) : undefined,
    //     customerId: customerId ? Number(customerId) : undefined,
    //     vulnerabilityId: vulnerabilityId ? Number(vulnerabilityId) : undefined,
    // });

    return res.status(200).json([]);
}, {
    methods: ["GET"]
});
