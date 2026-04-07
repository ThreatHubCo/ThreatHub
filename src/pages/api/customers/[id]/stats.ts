import { withApiHandler } from "@/lib/api";
import { CustomerStatus } from "@/lib/entities/Customer";
import { getCustomerStats } from "@/lib/repositories/customers";

export default withApiHandler(async (req, res, session) => {
    const { id } = req.query;
    const stats: CustomerStatus = await getCustomerStats(Number(id));

    return res.status(200).json(stats);
}, {
    methods: ["GET"],
    authRequired: true
});
