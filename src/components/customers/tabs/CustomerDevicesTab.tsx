import { BooleanCell } from "@/components/cell/BooleanCell";
import { Column, DataTable } from "@/components/ui/base/DataTable";
import { TableState } from "@/components/ui/base/TableStateWrapper";
import { toaster } from "@/components/ui/base/Toaster";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { Customer } from "@/lib/entities/Customer";
import { Device } from "@/lib/entities/Device";
import { Session } from "@/lib/entities/Session";
import { useTableMeta } from "@/lib/hooks/useTableMeta";
import { Filter, useTableQuery } from "@/lib/hooks/useTableQuery";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { formatDateTime } from "@/lib/utils/dates";
import { Button, Flex } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { ViewDeviceDrawer } from "../../devices/ViewDeviceDrawer";

interface Props {
    customer: Customer;
}

const tableFilters: Filter<any>[] = [
    { key: "dns_name", required: "dns_name", label: "Name", type: "text" },
    { key: "machine_id", required: "machine_id", label: "Machine ID (Defender)", type: "text" },
    { key: "os_platform", required: "os_platform", label: "OS Platform", type: "text" },
    { key: "is_aad_joined", required: "is_aad_joined", label: "Entra Joined?", type: "boolean" },
    { key: "total_vulnerabilities", required: "total_vulnerabilities", label: "CVEs", type: "number" },
    { key: "total_affected_software", required: "total_affected_software", label: "Vulnerable Software", type: "number" }
];

const defaultColumns = [
    "dns_name",
    "os_platform",
    "os_version",
    "last_seen_at",
    "is_aad_joined",
    "total_vulnerabilities",
    "total_affected_software",
    "actions"
];

export function CustomerDevicesTab({ customer }: Props) {
    const [rows, setRows] = useState<Device[]>([]);
    const [state, setState] = useState<TableState>(TableState.LOADING);
    const [error, setError] = useState(null);

    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

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
            const res = await fetch(`/api/customers/${customer.id}/devices?${params}`);
            const data = await res.json();

            if (!res.ok) {
                setState(TableState.FAILED);
                return;
            }

            setRows(data.rows);
            setTableMeta(data.meta);
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
        { key: "device_id", label: "ID", width: "100px", sortable: true },
        { key: "machine_id", label: "Machine ID (Defender)", width: "120px", sortable: false },
        { key: "dns_name", label: "DNS Name", width: "230px", sortable: true },
        { key: "os_platform", label: "OS Platform", width: "170px", sortable: true },
        { key: "os_version", label: "OS Version", width: "170px", sortable: true },
        { key: "is_aad_joined", label: "Entra Joined?", render: (row) => <BooleanCell value={row.is_aad_joined} />, width: "120px", sortable: true },
        { key: "last_seen_at", label: "Last Seen", render: (row) => <DateTextWithHover date={row.last_seen_at} reverse />, width: "120px", sortable: true },
        { key: "total_notes", label: "Notes", width: "100px", sortable: true },
        { key: "total_vulnerabilities", label: "CVEs", width: "100px", sortable: true },
        { key: "total_high_vulnerabilities", label: "High CVEs", width: "120px", sortable: true },
        { key: "total_critical_vulnerabilities", label: "Critical CVEs", width: "120px", sortable: true },
        { key: "total_affected_software", label: "Vulnerable Software", width: "100px", sortable: true },
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

    const exportOptions = {
        columns: [
            { name: "ID", key: "device_id" },
            { name: "Machine ID", key: "machine_id" },
            { name: "Name", key: "dns_name", shown: true },
            { name: "OS Platform", key: "os_platform", shown: true },
            { name: "OS Version", key: "os_version", shown: true },
            { name: "Entra Joined", key: "is_aad_joined", shown: true, boolean: true },
            { name: "Last Seen", key: "last_seen_at", shown: true, value: ({ value, data }) => formatDateTime(value) },
            { name: "CVEs", key: "total_vulnerabilities", shown: true },
            { name: "High CVEs", key: "total_high_vulnerabilities", shown: true },
            { name: "Critical CVEs", key: "total_critical_vulnerabilities", shown: true },
            { name: "Vulnerable Software", key: "total_affected_software", shown: true }
        ],
        fetchDataFn: async () => {
            // TODO: Create a dedicated endpoint for this
            const params = buildTableParams({
                state: {
                    page: 1,
                    limit: 5000,
                    filters: tableFilters,
                    sort: tableQuery.state.sort.key ? { key: String(tableQuery.state.sort.key), direction: tableQuery.state.sort.direction } : undefined
                }
            });

            const url = `/api/customers/${customer.id}/devices?${params}`;
            const res = await fetch(url);

            if (!res.ok) {
                toaster.create({ title: "Failed to fetch devices for export", type: "error" });
                return;
            }

            const data = await res.json();
            return data.devices;
        },
        outputFileName: `${customer.name.replaceAll(" ", "_").toLowerCase()}-devices`,
    }

    return (
        <>
            <DataTable
                id="client_devices_table"
                data={rows}
                columns={columns}
                defaultColumns={defaultColumns}
                state={state}
                tableQuery={tableQuery}
                tableMeta={tableMeta}
                exportOptions={exportOptions}
                error={error}
            />

            <ViewDeviceDrawer
                open={viewDrawerOpen}
                onOpen={setViewDrawerOpen}
                device={selectedDevice}
                customer={customer}
            />
        </>
    )
}