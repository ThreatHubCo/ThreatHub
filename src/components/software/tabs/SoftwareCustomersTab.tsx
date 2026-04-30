import { BooleanCell } from "@/components/cell/BooleanCell";
import { SeverityCell } from "@/components/cell/SeverityCell";
import { CreateTicketDrawer } from "@/components/remediation/CreateTicketDrawer";
import { Column, DataTable } from "@/components/ui/base/DataTable";
import { TableState } from "@/components/ui/base/TableStateWrapper";
import { toaster } from "@/components/ui/base/Toaster";
import { Tooltip } from "@/components/ui/base/Tooltip";
import { EPSSDisplay } from "@/components/ui/EPSSDisplay";
import { OpenInDefenderButton } from "@/components/ui/OpenInDefenderButton";
import { useConfig } from "@/lib/config/ConfigContext";
import { Customer } from "@/lib/entities/Customer";
import { Session } from "@/lib/entities/Session";
import { Software } from "@/lib/entities/Software";
import { useTableMeta } from "@/lib/hooks/useTableMeta";
import { Filter, useTableQuery } from "@/lib/hooks/useTableQuery";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { Button, Flex } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { LuMailPlus } from "react-icons/lu";

interface Props {
    software: Software;
}

const tableFilters: Filter<any>[] = [
    { key: "name", required: "name", label: "Name", type: "text" },
    { key: "tenant_id", required: "tenant_id", label: "Tenant ID", type: "text" }
];

const defaultColumns = [
    "name",
    "highest_cve_severity",
    "highest_cve_epss",
    "highest_cve_cvss_v3",
    "public_exploit",
    "exploit_verified",
    "actions"
];

export function SoftwareCustomersTab({ software }: Props) {
    const [rows, setRows] = useState<Customer[]>([]);
    const [state, setState] = useState<TableState>(TableState.LOADING);

    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [createTicketDrawerOpen, setCreateTicketDrawerOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | any | null>(null);

    const { data: session, status: sessionStatus } = useSession() as Session;
    const config = useConfig();

    const tableQuery = useTableQuery<Customer>(20, tableFilters);
    const { tableMeta, setTableMeta } = useTableMeta();

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchCustomers();
        }
    }, [sessionStatus, tableQuery.state.page, tableQuery.state.sort, tableQuery.state.filters]);

    function handleRowClick(customer: Customer) {
        setSelectedCustomer(customer);
        setViewDrawerOpen(true);
    }

    function enableTicketing() {
        return config.ENABLE_TICKETING && config.TICKET_SYSTEM_URL !== "" && config.TICKET_SYSTEM_URL !== null;
    }

    async function fetchCustomers() {
        try {
            setState(TableState.LOADING);

            const params = buildTableParams(tableQuery);
            const res = await fetch(`/api/software/${software.id}/customers?${params}`);
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
            toaster.create({ title: e.message || "An unknown error has occurred", type: "error" });
        }
    }

    const columns: Column<any>[] = useMemo(() => [
        { key: "id", label: "ID", width: "80px", sortable: true },
        { key: "name", label: "Name", width: "120px", sortable: true },
        { key: "tenant_id", label: "Tenant ID", width: "250px" },
        { key: "external_customer_id", label: "External Customer ID", width: "100px" },
        { key: "public_exploit", label: "Public Exploit", width: "90px", sortable: true, render: (row) => <BooleanCell value={row.public_exploit} /> },
        { key: "exploit_verified", label: "Verified Exploit", width: "90px", sortable: true, render: (row) => <BooleanCell value={row.exploit_verified} /> },
        { key: "highest_cve_severity", label: "Highest Severity", width: "100px", sortable: true, render: (row) => <SeverityCell severity={row.highest_cve_severity} /> },
        { key: "highest_cve_epss", label: "Highest EPSS", width: "90px", sortable: true, render: (row) => <EPSSDisplay epss={row.epss} /> },
        { key: "highest_cve_cvss_v3", label: "Highest CVSS", width: "90px", sortable: true },
        { key: "vulnerable_versions", label: "Vulnerable Versions" },
        {
            key: "actions", label: "Actions", render: (row) => (
                <Flex gap={0} alignItems="center">
                    <OpenInDefenderButton
                        url={`https://security.microsoft.com/vulnerability-management-inventories/applications/${software.vendor}-_-${software.name}`}
                        customer={row}
                        iconOnly
                    />

                    {enableTicketing() && (
                        <Tooltip content="Create Ticket">
                            <Button
                                size="sm"
                                variant="plain"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedCustomer(row);
                                    setCreateTicketDrawerOpen(true);
                                }}
                            >
                                <LuMailPlus />
                            </Button>
                        </Tooltip>
                    )}
                </Flex>
            )
        }
    ], []);

    return (
        <>
            <DataTable
                id="software_customers_table"
                data={rows}
                columns={columns}
                defaultColumns={defaultColumns}
                state={state}
                tableQuery={tableQuery}
                tableMeta={tableMeta}
            />

            <CreateTicketDrawer
                open={createTicketDrawerOpen}
                onOpen={setCreateTicketDrawerOpen}
                software={software}
                customer={selectedCustomer}
            />
        </>
    )
}