import { withApiHandler } from "@/lib/api";
import { getRecentEvents } from "@/lib/repositories/recommendations";

export default withApiHandler(async (req, res, session) => {
    const { id, days, recommendationId } = req.query;

    const recentEvents = await getRecentEvents({
        days: days ? Number(days) : undefined,
        customerId: Number(id),
        recommendationId: recommendationId ? Number(recommendationId) : undefined,
    });

    return res.status(200).json(recentEvents);
}, {
    methods: ["GET"]
});
