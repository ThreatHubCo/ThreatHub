import { BooleanCell } from "@/components/cell/BooleanCell";
import { SeverityCell } from "@/components/cell/SeverityCell";
import { Column, DataTable } from "@/components/ui/base/DataTable";
import { TableState } from "@/components/ui/base/TableStateWrapper";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { EPSSDisplay } from "@/components/ui/EPSSDisplay";
import { ViewVulnerabilityDrawer } from "@/components/vulnerabilities/ViewVulnerabilityDrawer";
import { Customer } from "@/lib/entities/Customer";
import { Session } from "@/lib/entities/Session";
import { Software } from "@/lib/entities/Software";
import { CustomerVulnerabilityWithFullInfo, Severity } from "@/lib/entities/Vulnerability";
import { useTableMeta } from "@/lib/hooks/useTableMeta";
import { Filter, useTableQuery } from "@/lib/hooks/useTableQuery";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { Button } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

interface Props {
    software: Software;
    customer?: Customer;
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

const tableFilters: Filter<CustomerVulnerabilityWithFullInfo>[] = [
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

export function SoftwareCVEsTab({ software, customer }: Props) {
    const [rows, setRows] = useState<CustomerVulnerabilityWithFullInfo[]>([]);
    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [selectedVuln, setSeletedVuln] = useState<CustomerVulnerabilityWithFullInfo | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [vulnerabilities, setVulnerabilities] = useState<CustomerVulnerabilityWithFullInfo[]>([]);
    const [state, setState] = useState<TableState>(TableState.LOADING);

    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    const tableQuery = useTableQuery<CustomerVulnerabilityWithFullInfo>(20, tableFilters);
    const { tableMeta, setTableMeta } = useTableMeta();

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchVulnerabilities();
        }
    }, [sessionStatus, tableQuery.state.page, tableQuery.state.sort, tableQuery.state.filters]);

    function handleRowClick(vuln: CustomerVulnerabilityWithFullInfo) {
        setSeletedVuln(vuln);
        setViewDrawerOpen(true);
    }

    async function fetchVulnerabilities() {
        try {
            setState(TableState.LOADING);
            setError("");

            const customerId = router.query.customer as string;
            const params = buildTableParams(tableQuery);

            const queryString = customerId ? `${params}&customer=${customerId}` : params;
            const res = await fetch(`/api/software/${software.id}/vulnerabilities?${queryString}`);

            if (!res.ok) {
                setState(TableState.FAILED);
                return;
            }

            const data = await res.json();

            setVulnerabilities(data.rows);
            setTableMeta(data.meta);
            setState(TableState.LOADED);
        } catch (e) {
            console.error(e);
            setState(TableState.FAILED);
            setError(e.message || "Unknown error occurred");
        }
    }

    const columns: Column<CustomerVulnerabilityWithFullInfo>[] = useMemo(() => [
        { key: "id", label: "DB ID", width: "100px", sortable: true },
        { key: "cve_id", label: "CVE", width: "150px", sortable: true },
        { key: "severity", label: "Severity", width: "130px", sortable: true, render: (row) => <SeverityCell severity={row.severity} /> },
        { key: "cvss_v3", label: "CVSS", width: "100px", sortable: true },
        { key: "epss", label: "EPSS", width: "100px", sortable: true, render: (row) => <EPSSDisplay epss={row.epss} /> },
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
                id="software_cves_table"
                data={vulnerabilities}
                columns={columns}
                defaultColumns={defaultColumns}
                state={state}
                tableQuery={tableQuery}
                tableMeta={tableMeta}
            />

            <ViewVulnerabilityDrawer
                open={viewDrawerOpen}
                onOpen={setViewDrawerOpen}
                vulnerability={selectedVuln}
            />
        </>
    )
}