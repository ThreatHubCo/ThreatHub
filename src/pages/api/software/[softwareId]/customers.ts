import { withApiHandler } from "@/lib/api";
import { getCustomersAffectedBySoftware } from "@/lib/repositories/customers";

export default withApiHandler(async (req, res, session) => {
    const softwareId = Number(req.query.softwareId);

    if (!softwareId) {
        return res.status(400).json({ error: "Missing software identifier" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const sortBy = req.query.sortBy as string;
    const sortDir = (req.query.sortDir as "asc" | "desc") || "desc";

    const name = req.query.name as string | undefined;
    const tenantId = req.query.tenant_id as string | undefined;

    const data = await getCustomersAffectedBySoftware(
        softwareId,
        {
            name,
            tenantId
        },
        page,
        pageSize,
        sortBy,
        sortDir
    );

    return res.status(200).json({
        rows: data.customers.map(c => ({
            ...c,
            highest_cve_epss: Number(c.highest_cve_epss),
            highest_cve_cvss_v3: Number(c.highest_cve_cvss_v3)
        })),
        meta: {
            totalItems: data.totalItems,
            totalPages: data.totalPages
        }
    });
}, {
    methods: ["GET"],
    authRequired: true
});
