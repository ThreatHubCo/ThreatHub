import { ViewClientSoftwareDrawer } from "@/components/software/ViewClientSoftwareDrawer";
import { ViewSoftwareDrawer } from "@/components/software/ViewSoftwareDrawer";
import { Column, DataTable, Filter } from "@/components/ui/base/DataTable";
import { Stat } from "@/components/ui/base/Stat";
import { EPSSDisplay } from "@/components/ui/EPSSDisplay";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { BooleanCell } from "@/components/cell/BooleanCell";
import { SeverityCell } from "@/components/cell/SeverityCell";
import { Session } from "@/lib/entities/Session";
import { Software } from "@/lib/entities/Software";
import { useTableQuery } from "@/lib/hooks/useTableQuery";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { findSoftwareInfo } from "@/lib/utils/softwareMap";
import { Button, Flex, Heading } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { LuInfo } from "react-icons/lu";

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
    { key: "devices_affected", required: "devices_affected", label: "Vulnerable Devices", type: "number" },
    { key: "clients_affected", required: "clients_affected", label: "Affected Clients", type: "number" },
    { key: "public_exploit", required: "public_exploit", label: "Public Exploit", type: "boolean" },
    { key: "auto_ticket_escalation_enabled", required: "auto_ticket_escalation_enabled", label: "Auto Escalation Enabled", type: "boolean" }
];

const defaultColumns = [
    "name",
    "vendor",
    "clients_affected",
    "devices_affected",
    "public_exploit",
    "vulnerabilities_count",
    "auto_ticket_escalation_enabled",
    "highest_cve_severity",
    "highest_cve_epss",
    "actions"
];

export default function SoftwareSummary({ sidebarCollapsed }: { sidebarCollapsed: boolean }) {
    const [globalDrawerOpen, setGlobalDrawerOpen] = useState(false);
    const [clientDrawerOpen, setClientDrawerOpen] = useState(false);
    const [selectedSoftware, setSelectedSoftware] = useState<any | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
                sort: sort.key ? {
                    key: String(sort.key),
                    direction: sort.direction
                } : undefined
            });

            const res = await fetch(`/api/software/summary?${params}`);

            if (!res.ok) {
                throw new Error("Failed to fetch software");
            }

            const data = await res.json();

            setRows(data.software);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        } catch (e) {
            console.error(e);
            setError(e.message || "An unknown error has occurred");
        } finally {
            setLoading(false);
        }
    }

    const columns: Column<Software>[] = useMemo(() => [
        { key: "id", label: "ID", width: "100px", sortable: true },
        { key: "name", label: "Name", width: "230px", sortable: true },
        { key: "defender_name", label: "Defender Name", width: "230px", sortable: true },
        { key: "vendor", label: "Vendor", width: "170px", sortable: true },
        { key: "public_exploit", label: "Public Exploit", width: "100px", sortable: true, render: (row) => <BooleanCell value={row.public_exploit} /> },
        { key: "clients_affected", label: "Affected Clients", width: "90px", sortable: true },
        { key: "devices_affected", label: "Vulnerable Devices", width: "90px", sortable: true },
        { key: "vulnerabilities_count", label: "CVEs", width: "90px", sortable: true },
        { key: "highest_cve_severity", label: "Highest Severity", width: "90px", sortable: true, render: (row) => <SeverityCell severity={row.highest_cve_severity} /> },
        { key: "highest_cve_epss", label: "Highest EPSS", width: "90px", sortable: true, render: (row) => <EPSSDisplay epss={row.highest_cve_epss} /> },
        { key: "highest_cve_cvss_v3", label: "Highest CVSS", width: "90px", sortable: true },
        { key: "auto_ticket_escalation_enabled", label: "Auto Escalation", width: "90px", render: (row) => <BooleanCell value={row.auto_ticket_escalation_enabled} />, sortable: true },
        { key: "summary", label: "Summary", render: ((row) => findSoftwareInfo(row).summary) },
        {
            key: "actions", label: "Actions", render: (row) => (
                <Flex gap={2}>
                    <Button
                        height={6}
                        onClick={() => {
                            setSelectedSoftware(row);
                            setGlobalDrawerOpen(true);
                        }}
                        variant="outline"
                        colorPalette="brand.dark"
                    >
                        Peek
                    </Button>
                    <Button
                        height={6}
                        onClick={() => {
                            router.push(`/software/${row.id}`)
                        }}
                    >
                        Open
                    </Button>
                </Flex>
            )
        }
    ], []);

    if (sessionStatus === "loading" || !router.isReady) {
        return <SkeletonPage />
    }

    if (!session) {
        router.push("/login");
        return false;
    }

    if (error) {
        return <ErrorPage error={error} />
    }

    return (
        <Page
            title="Software"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Heading size="3xl" marginBottom={4}>Software</Heading>

            <Flex gap={2} marginBottom={4} flexWrap="wrap">
                <Stat
                    icon={<LuInfo />}
                    label="Total Software"
                    value={loading ? "-" : totalItems.toString()}
                    bgColor="blue.100"
                    color="blue.700"
                />
            </Flex>

            <DataTable
                id="global_software_table"
                data={rows}
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
                loading={loading}
                error={error}
            />

            <ViewSoftwareDrawer
                open={globalDrawerOpen}
                onOpen={setGlobalDrawerOpen}
                software={selectedSoftware}
                onOpenClientDrawer={(customer) => {
                    setSelectedCustomer(customer);
                    setClientDrawerOpen(true);
                    setGlobalDrawerOpen(false);
                }}
            />

            {selectedCustomer && (
                <ViewClientSoftwareDrawer
                    open={clientDrawerOpen}
                    onOpen={setClientDrawerOpen}
                    software={selectedSoftware}
                    customer={selectedCustomer}
                    onOpenGlobal={() => {
                        setClientDrawerOpen(false);
                        setGlobalDrawerOpen(true);
                    }}
                />
            )}
        </Page>
    );
}
