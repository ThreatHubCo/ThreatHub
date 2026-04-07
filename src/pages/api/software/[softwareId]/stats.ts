import { withApiHandler } from "@/lib/api";
import { getSoftwareStats } from "@/lib/repositories/software";

export default withApiHandler(async (req, res, session) => {
    const { softwareId } = req.query;
    const customerId = req.query.customer as string | undefined;
    const customerNum = customerId ? Number(customerId) : undefined;
    
    const stats = await getSoftwareStats(Number(softwareId), customerNum);
    return res.status(200).json(stats);
}, {
    methods: ["GET"],
    authRequired: true
});
