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
import { Software } from "@/lib/entities/Software";
import { useRouter } from "next/router";

interface Props {
    software: Software;
    customer?: Customer;
}

const filtersConfig: Filter<any>[] = [
    { key: "dns_name", required: "dns_name", label: "Name", type: "text" },
    { key: "machine_id", required: "machine_id", label: "Machine ID (Defender)", type: "text" },
    { key: "os_platform", required: "os_platform", label: "OS Platform", type: "text" },
    { key: "is_aad_joined", required: "is_aad_joined", label: "Entra Joined?", type: "boolean" },
    { key: "total_vulnerabilities", required: "total_vulnerabilities", label: "CVEs", type: "number" }
];

const defaultColumns = [
    "dns_name",
    "os_platform",
    "os_version",
    "last_seen_at",
    "is_aad_joined",
    "total_vulnerabilities",
    "actions"
];

export function SoftwareDevicesTab({ software, customer }: Props) {
    const [rows, setRows] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(1);

    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | any | null>(null);

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
    }, [sessionStatus, page, filters, sort, customer]);

    function handleRowClick(device: Device) {
        setSelectedDevice(device);
        setViewDrawerOpen(true);
    }

    async function fetchDevices() {
        setLoading(true);
        try {
            const customerId = router.query.customer as string;

            const params = buildTableParams({
                page,
                pageSize: 20,
                filters,
                sort: sort.key ? { 
                    key: String(sort.key), 
                    direction: sort.direction 
                } : undefined
            });

            const url = customerId
                ? `/api/software/${software.id}/devices?${params}&customer=${customerId}`
                : `/api/software/${software.id}/devices?${params}`;

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
            toaster.create({ title: e.message, type: "error" });
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
                        onClick={() => router.push(`/devices/${row.device_id}`)}
                    >
                        Open
                    </Button>
                </Flex>
            )
        }
    ], []);

    return (
        <>
            <DataTable
                id="software_devices_table"
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
        </>
    )
}