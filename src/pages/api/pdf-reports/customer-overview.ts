import { withApiHandler } from "@/lib/api";
import { CustomerOverviewReport } from "@/lib/pdf/CustomerOverviewReport";

export default withApiHandler(async (req, res, _) => {
    const report = new CustomerOverviewReport();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=\"report.pdf\"");

    report.doc.pipe(res);
    report.generate();
    report.doc.end();
}, {
    methods: ["GET"],
    authRequired: false
});