import { withApiHandler } from "@/lib/api";
import { getEnrichedRecommendations, getRecommendationTotals } from "@/lib/repositories/recommendations";

export default withApiHandler(async (req, res) => {
    const customerId = Number(req.query.id);

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const sortBy = req.query.sortBy as string;
    const sortDir = (req.query.sortDir as "asc" | "desc") || "desc";

    const recommendationName = req.query.recommendationName as string | null;

    if (!customerId) {
        return res.status(400).json({ error: "Invalid customer id" });
    }

    const data = await getEnrichedRecommendations(
        customerId,
        recommendationName,
        sortBy,
        sortDir,
        page,
        pageSize
    );

    const stats = await getRecommendationTotals(customerId);

    return res.status(200).json({
        stats,
        recommendations: data.recommendations,
        totalItems: data.totalItems,
        totalPages: data.totalPages
    });
}, {
    methods: ["GET"],
    authRequired: true
});
