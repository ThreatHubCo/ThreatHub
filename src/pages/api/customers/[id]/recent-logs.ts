import { withApiHandler } from "@/lib/api";
import { getRecentCustomerLogs } from "@/lib/repositories/backendLogs";

export default withApiHandler(async (req, res, session) => {
    const { id } = req.query;
    const limit = Number(req.query.limit || 20);
    const effectiveLimit = limit > 50 ? 50 : limit;

    const logs = await getRecentCustomerLogs(Number(id), effectiveLimit);

    return res.status(200).json(logs);
}, {
    methods: ["GET"]
});
