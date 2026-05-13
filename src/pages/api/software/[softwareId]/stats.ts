import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";
import { getSoftwareStats } from "@/lib/repositories/software";

export default withApiHandler(async (req, res, session) => {
    const { softwareId } = req.query;
    const customerId = req.query.customer as string | undefined;
    const customerNum = customerId ? Number(customerId) : undefined;

    const stats = await getSoftwareStats(Number(softwareId), customerNum);

    const params: any[] = [softwareId];
    let customerFilter = "";

    if (customerNum) {
        customerFilter = "AND dv.customer_id = ?";
        params.push(customerNum);
    }

    const [cveBreakdown] = await pool.execute(`
        SELECT
            COUNT(DISTINCT CASE WHEN v.severity = 'Critical' THEN v.id END) AS total_critical,
            COUNT(DISTINCT CASE WHEN v.severity = 'High' THEN v.id END) AS total_high,
            COUNT(DISTINCT CASE WHEN v.severity = 'Medium' THEN v.id END) AS total_medium,
            COUNT(DISTINCT CASE WHEN v.severity = 'Low' THEN v.id END) AS total_low,
            COUNT(DISTINCT v.id) AS total
        FROM device_vulnerabilities dv
        INNER JOIN vulnerabilities v ON v.id = dv.vulnerability_id
        WHERE dv.software_id = ?
        ${customerFilter}
    `, params);

    return res.status(200).json({
        ...stats,
        cveBreakdown
    });
}, {
    methods: ["GET"],
    authRequired: true
});
