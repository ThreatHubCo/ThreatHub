import { withApiHandler } from "@/lib/api";
import { GlobalStats } from "@/lib/entities/Vulnerability";
import { getGlobalStats } from "@/lib/repositories/vulnerabilities";

export default withApiHandler(async (req, res, session) => {
    const stats: GlobalStats = await getGlobalStats();
    return res.status(200).json(stats);
}, {
    methods: ["GET"],
    authRequired: true
});
