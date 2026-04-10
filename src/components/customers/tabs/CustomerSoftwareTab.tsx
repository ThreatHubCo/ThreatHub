import { ViewClientSoftwareDrawer } from "@/components/software/ViewClientSoftwareDrawer";
import { ViewSoftwareDrawer } from "@/components/software/ViewSoftwareDrawer";
import { Column, DataTable, Filter } from "@/components/ui/base/DataTable";
import { toaster } from "@/components/ui/base/Toaster";
import { EPSSDisplay } from "@/components/ui/EPSSDisplay";
import { BooleanCell } from "@/components/cell/BooleanCell";
import { SeverityCell } from "@/components/cell/SeverityCell";
import { Customer } from "@/lib/entities/Customer";
import { Session } from "@/lib/entities/Session";
import { Software } from "@/lib/entities/Software";
import { useTableQuery } from "@/lib/hooks/useTableQuery";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { findSoftwareInfo } from "@/lib/utils/softwareMap";
import { Button, Flex } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

interface Props {
    customer: Customer;
}

const severityItems = [
    { label: "Critical", value: "Critical" },
    { label: "High", value: "High" },
    { label: "Medium", value: "Medium" },
    { label: "Low", value: "Low" }
];

const filtersConfig: Filter<Software>[] = [
    { key: "name", required: "name", label: "Name", type: "text" },
    { key: "vendor", required: "vendor", label: "Vendor", type: "text" },
    { key: "highest_cve_epss", required: "highest_cve_epss", label: "Highest EPSS", type: "number", text: "Please note that you must search between 0 and 1. For example 0.3 (this is equal to 30%)" },
    { key: "highest_cve_severity", required: "highest_cve_severity", label: "Highest Severity", type: "select", options: severityItems },
    { key: "vulnerabilities_count", required: "vulnerabilities_count", label: "CVEs", type: "number" },
    { key: "total_affected_devices", required: "total_affected_devices", label: "Vulnerable Devices", type: "number" },
    { key: "public_exploit", required: "public_exploit", label: "Public Exploit", type: "boolean" }
];

const defaultColumns = [
    "name",
    "vendor",
    "vulnerabilities_count",
    "public_exploit",
    "open_ticket_count",
    "total_affected_devices",
    "highest_cve_severity",
    "highest_cve_epss",
    "actions"
]

export function CustomerSoftwareTab({ customer }: Props) {
    const [clientDrawerOpen, setClientDrawerOpen] = useState(false);
    const [globalDrawerOpen, setGlobalDrawerOpen] = useState(false);
    const [selectedSoftware, setSelectedSoftware] = useState<any | null>(null);

    const [loading, setLoading] = useState(true);
    const [software, setSoftware] = useState(null);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(1);
    const [error, setError] = useState(null);

    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    const {
        page,
        filters,
        sort,
        setPage,
        setFilters,
        setSort
    } = useTableQuery<Software>();

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchSoftware();
        }
    }, [sessionStatus, page, filters, sort]);

    async function fetchSoftware() {
        setLoading(true);
        setError(null);

        try {
            const params = buildTableParams({
                page,
                pageSize: 20,
                filters,
                sort: sort.key ? { key: String(sort.key), direction: sort.direction } : undefined,
            });

            const url = `/api/customers/${customer.id}/software?${params}`

            const res = await fetch(url);

            if (!res.ok) {
                throw new Error("Failed to fetch software");
            }

            const data = await res.json();

            setSoftware(data.software);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        } catch (e) {
            console.error(e);
            setError(e.message || "An unknown error has occurred");
        } finally {
            setLoading(false);
        }
    }

    function handleViewSoftware(software: any) {
        setSelectedSoftware(software);
        setClientDrawerOpen(true);
    }

    const columns: Column<Software>[] = useMemo(() => [
        { key: "id", label: "ID", width: "100px", sortable: false },
        { key: "name", label: "Name", width: "230px", render: ((row) => findSoftwareInfo(row).name), sortable: true },
        { key: "defender_name", label: "Defender Name", width: "230px", render: (row) => row.name, sortable: true },
        { key: "vendor", label: "Vendor", width: "170px", sortable: true },
        { key: "public_exploit", label: "Public Exploit", width: "90px", sortable: true, render: (row) => <BooleanCell value={row.public_exploit} /> },
        { key: "exploit_verified", label: "Verified Exploit", width: "90px", sortable: true, render: (row) => <BooleanCell value={row.exploit_verified} /> },
        { key: "highest_cve_severity", label: "Highest Severity", width: "90px", sortable: true, render: (row) => <SeverityCell severity={row.highest_cve_severity} /> },
        { key: "highest_cve_epss", label: "Highest EPSS", width: "90px", sortable: true, render: (row) => <EPSSDisplay epss={row.highest_cve_epss} /> },
        { key: "highest_cve_cvss_v3", label: "Highest CVSS", width: "90px", sortable: true },
        { key: "open_ticket_count", label: "Open Tickets", width: "100px", sortable: true },
        { key: "vulnerabilities_count", label: "CVEs", width: "80px", sortable: true },
        { key: "total_affected_devices", label: "Vulnerable Devices", width: "100px", sortable: true },
        { key: "summary", label: "Summary", render: ((row) => findSoftwareInfo(row).summary) },
        { key: "notes", label: "Notes" },
        {
            key: "actions", label: "Actions", render: (row) => (
                <Flex gap={1}>
                    <Button
                        height={6}
                        onClick={() => handleViewSoftware(row)}
                        variant="outline"
                    >
                        Peek
                    </Button>

                    <Button
                        height={6}
                        onClick={() => {
                            router.push(`/software/${row.id}?customer=${customer.id}`)
                        }}
                    >
                        Open
                    </Button>
                </Flex>
            )
        }
    ], []);

    const exportOptions = {
        columns: [
            { name: "ID", key: "id" },
            { name: "Name", key: "name", shown: true, value: ({ value }) => findSoftwareInfo({ name: value } as any).name },
            { name: "Vendor", key: "vendor", shown: true, value: ({ value }) => findSoftwareInfo({ vendor: value } as any).vendor },
            { name: "Public Exploit", key: "public_exploit", shown: true, boolean: true },
            { name: "Verified Exploit", key: "exploit_verified", shown: true, boolean: true },
            { name: "Highest CVE Severity", key: "highest_cve_severity", shown: true },
            { name: "Highest CVE EPSS", key: "highest_cve_epss", shown: true },
            { name: "Highest CVE CVSS", key: "highest_cve_cvss_v3", shown: true },
            { name: "CVEs", key: "vulnerabilities_count", shown: true },
            { name: "Vulnerable Devices", key: "total_affected_devices", shown: true }
        ],
        fetchDataFn: async () => {
            const params = buildTableParams({
                page: 1,
                pageSize: 5000,
                filters,
                sort: sort.key ? { key: String(sort.key), direction: sort.direction } : undefined,
            });

            const url = `/api/customers/${customer.id}/software?${params}`;
            const res = await fetch(url);

            if (!res.ok) {
                toaster.create({ title: "Failed to fetch software for export", type: "error" });
                return;
            }

            const data = await res.json();
            return data.software;
        },
        outputFileName: `${customer.name.replaceAll(" ", "_").toLowerCase()}-software`,
    }

    return (
        <>
            <DataTable
                id="client_software_table"
                data={software}
                columns={columns}
                defaultColumns={defaultColumns}
                filters={filtersConfig}
                filterState={filters}
                sort={sort}
                onFilterChange={setFilters}
                onSortChange={(key, direction) => setSort(key)}
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                exportOptions={exportOptions}
                loading={loading}
                error={error}
            />

            <ViewClientSoftwareDrawer
                open={clientDrawerOpen}
                onOpen={setClientDrawerOpen}
                software={selectedSoftware}
                customer={customer}
                onOpenGlobal={() => {
                    setClientDrawerOpen(false);
                    setGlobalDrawerOpen(true);
                }}
            />
            <ViewSoftwareDrawer
                open={globalDrawerOpen}
                onOpen={setGlobalDrawerOpen}
                software={selectedSoftware}
                onOpenClientDrawer={(customer) => {
                    setClientDrawerOpen(true);
                    setGlobalDrawerOpen(false);
                }}
            />
        </>
    )
}