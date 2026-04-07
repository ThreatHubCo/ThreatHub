import { ViewDeviceDrawer } from "@/components/devices/ViewDeviceDrawer";
import { Column, DataTable, Filter } from "@/components/ui/base/DataTable";
import { Stat } from "@/components/ui/base/Stat";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { BooleanCell } from "@/components/cell/BooleanCell";
import { Device } from "@/lib/entities/Device";
import { Session } from "@/lib/entities/Session";
import { useTableQuery } from "@/lib/hooks/useTableQuery";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { Button, Flex, Heading } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { LuInfo } from "react-icons/lu";

const filtersConfig: Filter<any>[] = [
    { key: "dns_name", required: "dns_name", label: "Name", type: "text" },
    { key: "machine_id", required: "machine_id", label: "Machine ID (Defender)", type: "text" },
    { key: "os_platform", required: "os_platform", label: "OS Platform", type: "text" },
    { key: "customer_name", required: "customer_name", label: "Customer", type: "text" },
    { key: "is_aad_joined", required: "is_aad_joined", label: "Entra Joined?", type: "boolean" },
    { key: "total_vulnerabilities", required: "total_vulnerabilities", label: "CVEs", type: "number" },
    { key: "total_affected_software", required: "total_affected_software", label: "Vulnerable Software", type: "number" }
];

const defaultColumns = [
    "dns_name",
    "os_platform",
    "os_version",
    "is_aad_joined",
    "last_seen_at",
    "total_vulnerabilities",
    "total_affected_software",
    "customer_name",
    "actions"
];

export default function DevicesSummary({ sidebarCollapsed }: { sidebarCollapsed: boolean }) {
    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | any | null>(null);

    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(null);
    const [totalStaleDevices, setTotalStaleDevices] = useState(null);
    const [totalStaleDevices60Days, setTotalStaleDevices60Days] = useState(null);

    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    const {
        page,
        filters,
        sort,
        setPage,
        setFilters,
        setSort,
    } = useTableQuery<any>();

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchDevices();
        }
    }, [sessionStatus, page, filters, sort]);

    async function fetchDevices() {
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

            const res = await fetch(`/api/devices/summary?${params}`);

            if (!res.ok) {
                throw new Error("Failed to fetch devices");
            }

            const data = await res.json();

            setRows(data.devices);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
            setTotalStaleDevices(data.totalStaleDevices);
            setTotalStaleDevices60Days(data.totalStaleDevices60Days);
        } catch (e) {
            console.error(e);
            setError(e.message || "An unknown error has occurred");
        } finally {
            setLoading(false);
        }
    }

    function handleRowClick(device: Device) {
        setSelectedDevice(device);
        setViewDrawerOpen(true);
    }

    const columns: Column<any>[] = useMemo(() => [
        { key: "device_id", label: "ID", width: "100px", sortable: true },
        { key: "machine_id", label: "Machine ID (Defender)", width: "120px", sortable: false },
        { key: "dns_name", label: "DNS Name", width: "230px", sortable: true },
        { key: "customer_name", label: "Customer", width: "130px", sortable: true },
        { key: "os_platform", label: "OS Platform", width: "170px", sortable: true },
        { key: "os_version", label: "OS Version", width: "170px", sortable: true },
        { key: "is_aad_joined", label: "Entra Joined?", render: (row) => <BooleanCell value={row.is_aad_joined} reverse />, width: "120px", sortable: true },
        { key: "last_seen_at", label: "Last Seen", render: (row) => <DateTextWithHover date={row.last_seen_at} reverse />, width: "120px", sortable: true },
        { key: "total_notes", label: "Notes", width: "120px", sortable: true },
        { key: "total_vulnerabilities", label: "CVEs", width: "120px", sortable: true },
        { key: "total_high_vulnerabilities", label: "High CVEs", width: "120px", sortable: true },
        { key: "total_critical_vulnerabilities", label: "Critical CVEs", width: "120px", sortable: true },
        { key: "total_affected_software", label: "Vulnerable Software", width: "120px", sortable: true },
        {
            key: "actions", label: "Actions", render: (row) => (
                <Flex gap={1}>
                    <Button
                        height={6}
                        onClick={() => handleRowClick(row)}
                        variant="outline"
                    >
                        Peek
                    </Button>
                    <Button
                        height={6}
                        onClick={() => {
                            router.push(`/devices/${row.device_id}`)
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
        return <ErrorPage error={error} onRetry={fetchDevices} />
    }

    return (
        <Page
            title="Devices"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Heading size="3xl" marginBottom={4}>Devices</Heading>

            <Flex gap={4} marginBottom={4} flexWrap="wrap">
                <Stat
                    icon={<LuInfo />}
                    label="Total Devices"
                    value={totalItems?.toString()}
                    bgColor="blue.100"
                    color="blue.700"
                />
                <Stat
                    icon={<LuInfo />}
                    label="Not Seen in 30 Days"
                    value={totalStaleDevices?.toString()}
                    bgColor="orange.100"
                    color="orange.700"
                />
                <Stat
                    icon={<LuInfo />}
                    label="Not Seen in 60 Days"
                    value={totalStaleDevices60Days?.toString()}
                    bgColor="red.100"
                    color="red.700"
                />
            </Flex>

            <DataTable
                id="global_devices_table"
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

            {selectedDevice && (
                <ViewDeviceDrawer
                    open={viewDrawerOpen}
                    onOpen={setViewDrawerOpen}
                    device={selectedDevice}
                    customer={{
                        name: selectedDevice?.customer_name,
                        supports_csp: selectedDevice?.customer_supports_csp,
                        tenant_id: selectedDevice?.customer_tenant_id
                    }}
                />
            )}
        </Page>
    );
}
