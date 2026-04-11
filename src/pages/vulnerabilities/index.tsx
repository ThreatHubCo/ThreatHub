import { Column, DataTable, Filter } from "@/components/ui/base/DataTable";
import { Stat } from "@/components/ui/base/Stat";
import { Switch } from "@/components/ui/base/Switch";
import { toaster } from "@/components/ui/base/Toaster";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { EPSSDisplay } from "@/components/ui/EPSSDisplay";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { BooleanCell } from "@/components/cell/BooleanCell";
import { SeverityCell } from "@/components/cell/SeverityCell";
import { ViewVulnerabilityDrawer } from "@/components/vulnerabilities/ViewVulnerabilityDrawer";
import { Session } from "@/lib/entities/Session";
import { GlobalStats, Vulnerability } from "@/lib/entities/Vulnerability";
import { useTableQuery } from "@/lib/hooks/useTableQuery";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { formatAsPercent } from "@/lib/utils/utils";
import { Button, Flex, Heading, Text } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { LuInfo, LuTriangleAlert } from "react-icons/lu";

const severityItems = [
    { label: "Critical", value: "Critical" },
    { label: "High", value: "High" },
    { label: "Medium", value: "Medium" },
    { label: "Low", value: "Low" }
];

const filtersConfig: Filter<Vulnerability>[] = [
    { key: "cve_id", required: "cve_id", label: "CVE", type: "text" },
    { key: "severity", required: "severity", label: "Severity", type: "select", options: severityItems },
    { key: "public_exploit", required: "public_exploit", label: "Public Exploit", type: "boolean" },
    { key: "exploit_verified", required: "exploit_verified", label: "Verified Exploit", type: "boolean" },
    { key: "epss", required: "epss", label: "EPSS", type: "number", text: "Please note that you must search between 0 and 1. For example 0.3 (this is equal to 30%)" },
    { key: "total_affected_clients", required: "total_affected_clients", label: "Affected Clients", type: "number" },
    { key: "total_affected_software", required: "total_affected_software", label: "Vulnerable Software", type: "number" },
    { key: "total_affected_devices", required: "total_affected_devices", label: "Vulnerable Devices", type: "number" }
];

const defaultColumns = [
    "cve_id",
    "severity",
    "cvss_v3",
    "epss",
    "public_exploit",
    "exploit_verified",
    "total_affected_clients",
    "total_affected_software",
    "total_affected_devices",
    "actions"
];

export default function Vulnerabilities({ sidebarCollapsed }) {
    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);

    const [stats, setStats] = useState<GlobalStats>(null);
    const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(1);

    const [showTotalStats, setShowTotalStats] = useState(false);

    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    const {
        page,
        filters,
        sort,
        setPage,
        setFilters,
        setSort,
    } = useTableQuery<Vulnerability>();

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchVulnerabilities();
        }
    }, [sessionStatus, page, filters, sort, showTotalStats]);

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchStats();
        }
    }, []);

    async function fetchStats() {
        setLoadingStats(true);

        const url = `/api/vulnerabilities/stats`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            if (res.ok) {
                setStats(data);
            } else {
                toaster.create({ type: "error", title: data?.error ?? "Failed to fetch stats" });
            }
        } catch (e) {
            toaster.create({ type: "error", title: e.message })
            console.error(e);
        } finally {
            setLoadingStats(false);
        }
    }

    async function fetchVulnerabilities() {
        setLoading(true);
        setError(null);

        try {
            const params = buildTableParams({
                page,
                pageSize: 20,
                filters: {
                    ...filters,
                    hasAffectedClients: showTotalStats === false ? true : undefined
                },
                sort: sort.key ? {
                    key: String(sort.key),
                    direction: sort.direction
                } : undefined
            });

            const res = await fetch(`/api/vulnerabilities?${params}`);

            if (!res.ok) {
                throw new Error("Failed to fetch vulnerabilities");
            }

            const data = await res.json();

            setVulnerabilities(data.vulnerabilities);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        } catch (e) {
            console.error(e);
            setError(e.message || "Unknown error occurred");
        } finally {
            setLoading(false);
        }
    }

    const columns: Column<Vulnerability>[] = useMemo(() => [
        { key: "id", label: "DB ID", width: "100px", sortable: true },
        { key: "cve_id", label: "CVE", width: "150px", sortable: true },
        { key: "severity", label: "Severity", width: "100px", sortable: true, render: (row) => <SeverityCell severity={row.severity} /> },
        { key: "cvss_v3", label: "CVSS", width: "100px", sortable: true },
        { key: "epss", label: "EPSS", width: "100px", sortable: true, render: (row) => <EPSSDisplay epss={row.epss} /> },
        { key: "public_exploit", label: "Public Exploit", width: "100px", sortable: true, render: (row) => <BooleanCell value={row.public_exploit} /> },
        { key: "exploit_verified", label: "Exploit Verified", width: "100px", sortable: true, render: (row) => <BooleanCell value={row.exploit_verified} /> },
        { key: "total_affected_software", label: "Vulnerable Software", width: "100px", sortable: true },
        { key: "total_affected_devices", label: "Vulnerable Devices", width: "100px", sortable: true },
        { key: "total_affected_clients", label: "Affected Clients", width: "90px", sortable: true },
        { key: "published_at", label: "Publish Date", width: "150px", sortable: true, render: (row) => <DateTextWithHover date={row.published_at} withTime /> },
        { key: "updated_at", label: "Last Updated", width: "150px", sortable: true, render: (row) => <DateTextWithHover date={row.updated_at} withTime /> },
        { key: "first_detected_at", label: "First Detected", width: "150px", sortable: true, render: (row) => <DateTextWithHover date={row.first_detected_at} withTime /> },
        {
            key: "actions", label: "Actions", render: (row) => (
                <Button
                    height={6}
                    onClick={() => {
                        setSelectedVuln(row);
                        setViewDrawerOpen(true);
                    }}
                >
                    View
                </Button>
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
            title="Vulnerabilities"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Heading size="3xl" marginBottom={2}>Vulnerabilities</Heading>

            <Text marginBottom={4}>
                This page shows vulnerabilties across all customers.
            </Text>

            <Flex gap={2} flexWrap="wrap" marginBottom={4}>
                <Stat
                    icon={<LuInfo />}
                    label="Total CVEs"
                    value={showTotalStats ? stats?.global?.totalCves.toString() : stats?.clientScoped?.totalCves.toString()}
                    bgColor="blue.100"
                    color="blue.700"
                />
                <Stat
                    icon={<LuTriangleAlert />}
                    label="Critical CVEs"
                    value={showTotalStats ? stats?.global?.totalCriticalCves.toString() : stats?.clientScoped?.totalCriticalCves.toString()}
                    bgColor="red.100"
                    color="red.700"
                />
                <Stat
                    icon={<LuTriangleAlert />}
                    label="Public Exploit"
                    value={showTotalStats ? stats?.global?.totalPublicExploitCves.toString() : stats?.clientScoped?.totalPublicExploitCves.toString()}
                    bgColor="orange.100"
                    color="orange.700"
                />
            </Flex>

            <Switch
                checked={showTotalStats}
                onCheckedChange={(e) => setShowTotalStats(e.checked)}
                marginBottom={2}
            >
                Show Total Stats
            </Switch>

            <Text
                fontSize="12px"
                color="gray.600"
                marginBottom={4}
            >
                Showing {showTotalStats ? "total stats (all CVEs)" : "only customer-exposed CVEs"}
            </Text>

            <DataTable
                id="cves_table"
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
                loading={loading}
                error={error}
            />

            <ViewVulnerabilityDrawer
                open={viewDrawerOpen}
                onOpen={setViewDrawerOpen}
                vulnerability={selectedVuln}
            />
        </Page>
    );
}
