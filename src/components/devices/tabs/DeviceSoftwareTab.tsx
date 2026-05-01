import { BooleanCell } from "@/components/cell/BooleanCell";
import { SeverityCell } from "@/components/cell/SeverityCell";
import { ViewClientSoftwareDrawer } from "@/components/software/ViewClientSoftwareDrawer";
import { ViewSoftwareDrawer } from "@/components/software/ViewSoftwareDrawer";
import { Column, DataTable } from "@/components/ui/base/DataTable";
import { TableState } from "@/components/ui/base/TableStateWrapper";
import { EPSSDisplay } from "@/components/ui/EPSSDisplay";
import { FullDevice } from "@/lib/entities/Device";
import { Session } from "@/lib/entities/Session";
import { Software } from "@/lib/entities/Software";
import { useTableMeta } from "@/lib/hooks/useTableMeta";
import { Filter, useTableQuery } from "@/lib/hooks/useTableQuery";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { findSoftwareInfo } from "@/lib/utils/softwareMap";
import { Button, Flex, Link } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

interface Props {
    device: FullDevice;
}

const tableFilters: Filter<Software>[] = [
    { key: "name", required: "name", label: "Name", type: "text" },
    { key: "vendor", required: "vendor", label: "Vendor", type: "text" }
];

const defaultColumns = [
    "name",
    "vendor",
    "public_exploit",
    "vulnerabilities_count",
    "auto_ticket_escalation_enabled",
    "highest_cve_severity",
    "highest_cve_epss",
    "actions"
];

export function DeviceSoftwareTab({ device }: Props) {
    const [rows, setRows] = useState<Software[]>([]);
    const [state, setState] = useState<TableState>(TableState.LOADING);

    const [globalDrawerOpen, setGlobalDrawerOpen] = useState(false);
    const [clientDrawerOpen, setClientDrawerOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState({
        id: device.customer_id,
        name: device.customer_name,
        supports_csp: device.customer_supports_csp,
        tenant_id: device.customer_tenant_id
    });
    const [selectedSoftware, setSelectedSoftware] = useState<Software | any | null>(null);
    const [error, setError] = useState(null);

    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    const tableQuery = useTableQuery<Software>(20, tableFilters);
    const { tableMeta, setTableMeta } = useTableMeta();

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchSoftware();
        }
    }, [sessionStatus, tableQuery.state.page, tableQuery.state.sort, tableQuery.state.filters]);

    function handleRowClick(software: Software) {
        setSelectedSoftware(software);
        setClientDrawerOpen(true);
    }

    async function fetchSoftware() {
        try {
            setState(TableState.LOADING);
            setError("");

            const params = buildTableParams(tableQuery);
            const res = await fetch(`/api/devices/${device.id}/software?${params}`);
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

    const columns: Column<Software>[] = useMemo(() => [
        { key: "id", label: "ID", width: "100px", sortable: true },
        { key: "name", label: "Name", width: "230px", render: ((row) => findSoftwareInfo(row).name), sortable: true },
        { key: "defender_name", label: "Defender Name", width: "230px", render: (row) => row.name, sortable: true },
        { key: "vendor", label: "Vendor", width: "170px", sortable: true },
        { key: "public_exploit", label: "Public Exploit", width: "100px", sortable: true, render: (row) => <BooleanCell value={row.public_exploit} /> },
        { key: "vulnerabilities_count", label: "CVEs", width: "90px", sortable: true },
        { key: "highest_cve_severity", label: "Highest Severity", width: "90px", sortable: true, render: (row) => <SeverityCell severity={row.highest_cve_severity} /> },
        { key: "highest_cve_epss", label: "Highest EPSS", width: "90px", sortable: true, render: (row) => <EPSSDisplay epss={row.highest_cve_epss} /> },
        { key: "highest_cve_cvss_v3", label: "Highest CVSS", width: "90px", sortable: true },
        { key: "summary", label: "Summary", render: ((row) => findSoftwareInfo(row).summary) },
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
                    <Link href={`/software/${row.id}`}>
                        <Button
                            colorPalette="brand"
                            height={6}
                        >
                            Open
                        </Button>
                    </Link>
                </Flex>
            )
        }
    ], []);

    return (
        <>
            <DataTable
                id="device_software_table"
                data={rows}
                columns={columns}
                defaultColumns={defaultColumns}
                state={state}
                tableQuery={tableQuery}
                tableMeta={tableMeta}
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

            <ViewClientSoftwareDrawer
                open={clientDrawerOpen}
                onOpen={setClientDrawerOpen}
                software={selectedSoftware}
                customer={selectedCustomer}
                onOpenGlobal={() => {
                    setClientDrawerOpen(false);
                    setGlobalDrawerOpen(true);
                    setSelectedCustomer({
                        id: device.customer_id,
                        name: device.customer_name,
                        supports_csp: device.customer_supports_csp,
                        tenant_id: device.customer_tenant_id
                    });
                }}
            />
        </>
    )
}