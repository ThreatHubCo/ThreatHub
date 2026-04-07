import { withApiHandler } from "@/lib/api";
import { getDeviceStats } from "@/lib/repositories/devices";

export default withApiHandler(async (req, res, session) => {
    const { id } = req.query;

    const stats = await getDeviceStats(Number(id));
    return res.status(200).json(stats);
}, {
    methods: ["GET"],
    authRequired: true
});
