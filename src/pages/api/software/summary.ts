import { withApiHandler } from "@/lib/api";
import { getAffectedSoftware } from "@/lib/repositories/software";

interface GetAffectedSoftwareQuery {
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    name?: string;
    vendor?: string;
    highest_cve_epss?: string;
    highest_cve_severity?: string;
    vulnerabilities_count?: string;
    devices_affected?: string;
    clients_affected?: string;
    public_exploit?: string;
    auto_ticket_escalation_enabled?: string;
}

const sortableColumns = new Set<string>([
    "id",
    "name",
    "defender_name",
    "vendor",
    "public_exploit",
    "clients_affected",
    "devices_affected",
    "vulnerabilities_count",
    "highest_cve_severity",
    "highest_cve_epss",
    "highest_cve_cvss_v3",
    "auto_ticket_escalation_enabled"
]);

export default withApiHandler(async (req, res) => {
    const query = req.query as GetAffectedSoftwareQuery;

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));

    const sortBy = sortableColumns.has(query.sortBy) ? query.sortBy : "vulnerabilities_count";
    const sortDir = query.sortDir === "desc" ? "desc" : "desc";

    const filters = {
        name: query.name,
        vendor: query.vendor,
        highest_cve_epss: query.highest_cve_epss,
        highest_cve_severity: query.highest_cve_severity,
        vulnerabilities_count: query.vulnerabilities_count,
        devices_affected: query.devices_affected,
        clients_affected: query.clients_affected,
        public_exploit: query.public_exploit,
        auto_ticket_escalation_enabled: query.auto_ticket_escalation_enabled
    };

    const data = await getAffectedSoftware(
        filters,
        sortBy,
        sortDir,
        page,
        pageSize
    );

    return res.status(200).json({
        software: data.software.map(row => ({
            ...row,
            highest_cve_epss: row.highest_cve_epss !== null ? Number(row.highest_cve_epss) : null,
            highest_cve_cvss_v3: row.highest_cve_cvss_v3 !== null ? Number(row.highest_cve_cvss_v3) : null
        })),
        totalItems: data.totalItems,
        totalPages: data.totalPages
    });
}, {
    methods: ["GET"],
    authRequired: true
});