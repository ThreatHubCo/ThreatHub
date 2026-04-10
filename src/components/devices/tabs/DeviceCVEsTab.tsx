import { Column, DataTable, Filter } from "@/components/ui/base/DataTable";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { EPSSDisplay } from "@/components/ui/EPSSDisplay";
import { BooleanCell } from "@/components/cell/BooleanCell";
import { SeverityCell } from "@/components/cell/SeverityCell";
import { ViewClientVulnerabilityDrawer } from "@/components/vulnerabilities/ViewClientVulnerabilityDrawer";
import { Device } from "@/lib/entities/Device";
import { Session } from "@/lib/entities/Session";
import { CustomerVulnerabilityWithFullInfo, Severity } from "@/lib/entities/Vulnerability";
import { useTableQuery } from "@/lib/hooks/useTableQuery";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { Button } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

interface Props {
    device: Device;
}

export interface Filters {
    severity?: Severity;
    public_exploit?: number | string;
    exploit_verified?: number | string;
    cve_id?: string;
    [key: string]: any;
}

const severityItems = [
    { label: "Critical", value: "Critical" },
    { label: "High", value: "High" },
    { label: "Medium", value: "Medium" },
    { label: "Low", value: "Low" }
];

const filtersConfig: Filter<CustomerVulnerabilityWithFullInfo>[] = [
    { key: "cve_id", required: "cve_id", label: "CVE", type: "text" },
    { key: "severity", required: "severity", label: "Severity", type: "select", options: severityItems }
];

const defaultColumns = [
    "cve_id",
    "severity",
    "cvss_v3",
    "epss",
    "public_exploit",
    "exploit_verified",
    "total_affected_software",
    "total_affected_devices",
    "actions"
];

export function DeviceCVEsTab({ device }: Props) {
    const [rows, setRows] = useState<CustomerVulnerabilityWithFullInfo[]>([]);
    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [selectedVuln, setSeletedVuln] = useState<CustomerVulnerabilityWithFullInfo | null>(null);

    const [loadingVulns, setLoadingVulns] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [vulnerabilities, setVulnerabilities] = useState<CustomerVulnerabilityWithFullInfo[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(1);

    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    const {
        page,
        filters,
        sort,
        setPage,
        setFilters,
        setSort,
    } = useTableQuery<CustomerVulnerabilityWithFullInfo>();

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchVulnerabilities();
        }
    }, [sessionStatus, page, filters, sort]);

    function handleRowClick(vuln: CustomerVulnerabilityWithFullInfo) {
        setSeletedVuln(vuln);
        setViewDrawerOpen(true);
    }

    async function fetchVulnerabilities() {
        setLoadingVulns(true);
        setError(null);

        try {
            const params = buildTableParams({
                page,
                pageSize: 20,
                filters,
                sort: sort.key ? {
                    key: String(sort.key),
                    direction: sort.direction
                } : undefined
            });

            const res = await fetch(`/api/devices/${device.id}/vulnerabilities?${params}`);

            if (!res.ok) {
                throw new Error("Failed to fetch vulnerabilities");
            }

            const data = await res.json();

            setVulnerabilities(data.vulnerabilities);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        } catch (e) {
            console.error(e);
            setError(e.message || "An unknown error has occurred");
        } finally {
            setLoadingVulns(false);
        }
    }

    const columns: Column<CustomerVulnerabilityWithFullInfo>[] = useMemo(() => [
        { key: "id", label: "DB ID", width: "100px", sortable: true },
        { key: "cve_id", label: "CVE", width: "150px", sortable: true },
        { key: "severity", label: "Severity", width: "130px", sortable: true, render: (row) => <SeverityCell severity={row.severity} /> },
        { key: "cvss_v3", label: "CVSS", width: "100px", sortable: true },
        { key: "epss", label: "EPSS", width: "100px", render: (row) => <EPSSDisplay epss={row.epss} />, sortable: true },
        { key: "public_exploit", label: "Public Exploit", width: "130px", sortable: true, render: (row) => <BooleanCell value={row.public_exploit} /> },
        { key: "exploit_verified", label: "Exploit Verified", width: "130px", sortable: true, render: (row) => <BooleanCell value={row.exploit_verified} /> },
        { key: "total_affected_software", label: "Vulnerable Software", width: "130px", sortable: true },
        { key: "total_affected_devices", label: "Vulnerable Devices", width: "130px", sortable: true },
        { key: "published_at", label: "Publish Date", width: "150px", sortable: true, render: (row) => <DateTextWithHover date={row.published_at} withTime /> },
        { key: "updated_at", label: "Last Updated", width: "150px", sortable: true, render: (row) => <DateTextWithHover date={row.updated_at} withTime /> },
        { key: "first_detected_at", label: "First Detected", width: "150px", sortable: true, render: (row) => <DateTextWithHover date={row.first_detected_at} withTime /> },
        {
            key: "actions", label: "Actions", render: (row) => (
                <Button
                    height={6}
                    onClick={() => handleRowClick(row)}
                >
                    View
                </Button>
            )
        }
    ], []);

    return (
        <>
            <DataTable
                id="device_cves_table"
                data={vulnerabilities}
                columns={columns}
                defaultColumns={defaultColumns}
                filters={filtersConfig}
                filterState={filters}
                sort={sort}
                onFilterChange={setFilters}
                onSortChange={(key, direction) => setSort(key)}
                onPageChange={setPage}
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                loading={loadingVulns}
                error={error}
            />

            <ViewClientVulnerabilityDrawer
                open={viewDrawerOpen}
                onOpen={setViewDrawerOpen}
                vulnerability={selectedVuln}
                customerId={device.customer_id}
            />
        </>
    )
}