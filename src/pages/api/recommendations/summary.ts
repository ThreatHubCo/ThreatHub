import { withApiHandler } from "@/lib/api";
import { getAggregatedRecommendations, getAllDistinctRemediationTypes } from "@/lib/repositories/recommendations";

export default withApiHandler(async (req, res) => {
    const onlyWithExposure = req.query.onlyWithExposure === "true";
    const sortBy = req.query.sortBy as string | undefined;
    const sortDir = (req.query.sortDir as "asc" | "desc") || "desc";
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const filters = {
        recommendation_name: req.query.recommendation_name as string | undefined,
        product_name: req.query.product_name as string | undefined,
        vendor: req.query.vendor as string | undefined,
        remediation_type: req.query.remediation_type as string | undefined,
        related_component: req.query.related_component as string | undefined
    }

    const data = await getAggregatedRecommendations({
        onlyWithExposure,
        sortBy,
        sortDir,
        page,
        pageSize,
        filters
    });

    const remediationTypes = await getAllDistinctRemediationTypes();

    return res.status(200).json({
        remediationTypes,
        rows: data.recommendations,
        meta: {
            totalItems: data.totalItems,
            totalPages: data.totalPages
        }
    });
}, {
    methods: ["GET"],
    authRequired: true
});