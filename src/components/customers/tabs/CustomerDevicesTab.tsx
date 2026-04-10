import { Column, DataTable, Filter } from "@/components/ui/base/DataTable";
import { Customer } from "@/lib/entities/Customer";
import { Device } from "@/lib/entities/Device";
import { Button, Flex } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { ViewDeviceDrawer } from "../../devices/ViewDeviceDrawer";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { useTableQuery } from "@/lib/hooks/useTableQuery";
import { useSession } from "next-auth/react";
import { Session } from "@/lib/entities/Session";
import { toaster } from "@/components/ui/base/Toaster";
import { BooleanCell } from "@/components/cell/BooleanCell";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { useRouter } from "next/router";
import { formatDate, formatDateReadable, formatDateTime } from "@/lib/utils/dates";
import { LuExternalLink, LuEye } from "react-icons/lu";

interface Props {
    customer: Customer;
}

const filtersConfig: Filter<any>[] = [
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

export function CustomerDevicesTab({
    customer
}: Props) {
    const [rows, setRows] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(1);
    const [error, setError] = useState(null);

    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

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

    function handleRowClick(device: Device) {
        setSelectedDevice(device);
        setViewDrawerOpen(true);
    }

    async function fetchDevices() {
        setLoading(true);
        setError(null);

        try {
            const params = buildTableParams({
                page,
                pageSize: 20,
                filters,
                sort: sort.key ? { key: String(sort.key), direction: sort.direction } : undefined,
            });

            const url = `/api/customers/${customer.id}/devices?${params}`

            const res = await fetch(url);

            if (!res.ok) {
                throw new Error("Failed to fetch devices");
            }

            const data = await res.json();

            setRows(data.devices);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        } catch (e) {
            console.error(e);
            setError(e.message || "An unknown error has occurred");
        } finally {
            setLoading(false);
        }
    }

    const columns: Column<any>[] = useMemo(() => [
        { key: "device_id", label: "ID", width: "100px", sortable: true },
        { key: "machine_id", label: "Machine ID (Defender)", width: "120px", sortable: false },
        { key: "dns_name", label: "DNS Name", width: "230px", sortable: true },
        { key: "os_platform", label: "OS Platform", width: "170px", sortable: true },
        { key: "os_version", label: "OS Version", width: "170px", sortable: true },
        { key: "is_aad_joined", label: "Entra Joined?", render: (row) => <BooleanCell value={row.is_aad_joined} reverse />, width: "120px", sortable: true },
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
    ]);

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
            const params = buildTableParams({
                page: 1,
                pageSize: 5000,
                filters,
                sort: sort.key ? { key: String(sort.key), direction: sort.direction } : undefined,
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
                filters={filtersConfig}
                filterState={filters}
                sort={sort}
                onFilterChange={setFilters}
                onSortChange={(key, direction) => setSort(key)}
                onPageChange={setPage}
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                exportOptions={exportOptions}
                loading={loading}
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