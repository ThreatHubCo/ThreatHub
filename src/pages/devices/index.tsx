import { BooleanCell } from "@/components/cell/BooleanCell";
import { ViewDeviceDrawer } from "@/components/devices/ViewDeviceDrawer";
import { Column, DataTable } from "@/components/ui/base/DataTable";
import { Stat } from "@/components/ui/base/Stat";
import { TableState } from "@/components/ui/base/TableStateWrapper";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { Device } from "@/lib/entities/Device";
import { Session } from "@/lib/entities/Session";
import { useTableMeta } from "@/lib/hooks/useTableMeta";
import { Filter, useTableQuery } from "@/lib/hooks/useTableQuery";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { Button, Flex, Heading } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { LuInfo } from "react-icons/lu";

const tableFilters: Filter<any>[] = [
    { key: "dns_name", label: "Name", type: "text" },
    { key: "machine_id", label: "Machine ID (Defender)", type: "text" },
    { key: "os_platform", label: "OS Platform", type: "text" },
    { key: "os_version", label: "OS Version", type: "text" },
    { key: "os_architecture", label: "OS Architecture", type: "text" },
    { key: "managed_by", label: "Managed By", type: "text" },
    { key: "customer_name", label: "Customer", type: "text" },
    { key: "is_aad_joined", label: "Entra Joined?", type: "boolean" },
    { key: "total_vulnerabilities", label: "CVEs", type: "number" },
    { key: "total_affected_software", label: "Vulnerable Software", type: "number" }
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
    const [error, setError] = useState<string | null>(null);
    const [state, setState] = useState<TableState>(TableState.LOADING);
    const [totalStaleDevices, setTotalStaleDevices] = useState(null);
    const [totalStaleDevices60Days, setTotalStaleDevices60Days] = useState(null);
    const [totalNotEntraJoined, setTotalNotEntraJoined] = useState(null);

    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    const tableQuery = useTableQuery<Device>(20, tableFilters);
    const { tableMeta, setTableMeta } = useTableMeta();

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchDevices();
        }
    }, [sessionStatus, tableQuery.state.page, tableQuery.state.sort, tableQuery.state.filters]);

    async function fetchDevices() {
        try {
            setState(TableState.LOADING);
            setError("");

            const params = buildTableParams(tableQuery);
            const res = await fetch(`/api/devices/summary?${params}`);
            const data = await res.json();

            if (!res.ok) {
                setState(TableState.FAILED);
                return;
            }

            setRows(data.rows);
            setTableMeta(data.meta);
            setTotalStaleDevices(data.meta.totalStaleDevices);
            setTotalStaleDevices60Days(data.meta.totalStaleDevices60Days);
            setTotalNotEntraJoined(data.meta.totalNotEntraJoined);

            setState(TableState.LOADED);
        } catch (e) {
            console.error(e);
            setState(TableState.FAILED);
            setError(e.message || "An unknown error has occurred");
        }
    }

    function handleRowClick(device: Device) {
        setSelectedDevice(device);
        setViewDrawerOpen(true);
    }

    const columns: Column<any>[] = useMemo(() => [
        { key: "id", label: "ID", width: "100px", sortable: true },
        { key: "machine_id", label: "Machine ID (Defender)", width: "120px", sortable: false },
        { key: "dns_name", label: "DNS Name", width: "230px", sortable: true },
        { key: "customer_name", label: "Customer", width: "130px", sortable: true },
        { key: "os_platform", label: "OS Platform", width: "170px", sortable: true },
        { key: "os_version", label: "OS Version", width: "170px", sortable: true },
        { key: "os_build", label: "OS Build", width: "170px", sortable: true },
        { key: "os_processor", label: "Processor", width: "170px", sortable: true },
        { key: "os_architecture", label: "OS Arch", width: "170px", sortable: true },
        { key: "risk_score", label: "Risk Score", width: "170px", sortable: true },
        { key: "managed_by", label: "Managed By", width: "170px", sortable: true },
        { key: "is_aad_joined", label: "Entra Joined?", render: (row) => <BooleanCell value={row.is_aad_joined} />, width: "120px", sortable: true },
        { key: "first_seen_at", label: "First Seen", render: (row) => <DateTextWithHover date={row.first_seen_at} reverse />, width: "120px", sortable: true },
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
                        colorPalette="brand.dark"
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
            <Flex
                flexDirection={{ base: "column", md: "row" }}
                justifyContent="space-between"
                marginBottom={4}
            >
                <Heading size="3xl">Devices</Heading>
            </Flex>

            <Flex gap={2} marginBottom={4} flexWrap="wrap">
                <Stat
                    icon={<LuInfo />}
                    label="Total Devices"
                    value={tableMeta?.totalItems?.toString()}
                    bgColor="blue.100"
                    color="blue.600"
                    flex="0 0 250px"
                />
                <Stat
                    icon={<LuInfo />}
                    label="Not Entra Joined"
                    value={totalNotEntraJoined?.toString()}
                    bgColor="orange.100"
                    color="orange.600"
                    flex="0 0 250px"
                />
                <Stat
                    icon={<LuInfo />}
                    label="Not Seen in 30 Days"
                    value={totalStaleDevices?.toString()}
                    bgColor="orange.100"
                    color="orange.600"
                    flex="0 0 250px"
                />
                <Stat
                    icon={<LuInfo />}
                    label="Not Seen in 60 Days"
                    value={totalStaleDevices60Days?.toString()}
                    bgColor="red.100"
                    color="red.600"
                    flex="0 0 250px"
                />
            </Flex>

            <DataTable
                id="global_devices_table"
                data={rows}
                columns={columns}
                defaultColumns={defaultColumns}
                state={state}
                tableMeta={tableMeta}
                tableQuery={tableQuery}
                error={error}
            />

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
        </Page>
    );
}

