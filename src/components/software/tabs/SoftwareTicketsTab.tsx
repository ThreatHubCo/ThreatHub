import { TicketStatusCell } from "@/components/cell/TicketStatusCell";
import { CreateTicketDrawer } from "@/components/remediation/CreateTicketDrawer";
import { ViewTicketDrawer } from "@/components/remediation/ViewTicketDrawer";
import { Column, DataTable } from "@/components/ui/base/DataTable";
import { TableState } from "@/components/ui/base/TableStateWrapper";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { Customer } from "@/lib/entities/Customer";
import { RemediationTicket, RemediationTicketStatus } from "@/lib/entities/RemediationTicket";
import { Session } from "@/lib/entities/Session";
import { Software } from "@/lib/entities/Software";
import { useTableMeta } from "@/lib/hooks/useTableMeta";
import { Filter, useTableQuery } from "@/lib/hooks/useTableQuery";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { Button } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { LuPlus } from "react-icons/lu";

interface Props {
    software: Software;
    customer?: Customer;
}

const statusItems = [
    { label: "Open", value: RemediationTicketStatus.OPEN },
    { label: "Closed (Grace Period)", value: RemediationTicketStatus.CLOSED_GRACE_PERIOD },
    { label: "Closed (Permanently)", value: RemediationTicketStatus.CLOSED },
    { label: "Unknown", value: RemediationTicketStatus.UNKNOWN }
];

const tableFilters: Filter<any>[] = [
    { key: "external_ticket_id", required: "external_ticket_id", label: "External Ticket ID", type: "text" },
    { key: "customer_name", required: "customer_name", label: "Customer", type: "text" },
    { key: "status", required: "status", label: "Status", type: "select", options: statusItems },
    { key: "opened_by_agent_id", required: "opened_by_agent_id", label: "Opened By", type: "text" }
];

const defaultColumns = [
    "external_ticket_id",
    "customer_name",
    "status",
    "opened_by_agent_name",
    "last_sync_at",
    "last_ticket_update_at",
    "actions"
];

export function SoftwareTicketsTab({ software, customer }: Props) {
    const [rows, setRows] = useState<RemediationTicket[]>([]);
    const [state, setState] = useState<TableState>(TableState.LOADING);
    const [createTicketDrawerOpen, setCreateTicketDrawerOpen] = useState(false);
    const [error, setError] = useState(null);

    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<RemediationTicket | null>(null);

    const { data: session, status: sessionStatus } = useSession() as Session;

    const tableQuery = useTableQuery<RemediationTicket>(20, tableFilters);
    const { tableMeta, setTableMeta } = useTableMeta();

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchTickets();
        }
    }, [sessionStatus, tableQuery.state.page, tableQuery.state.sort, tableQuery.state.filters]);

    function handleRowClick(ticket: RemediationTicket) {
        setSelectedTicket(ticket);
        setViewDrawerOpen(true);
    }

    async function fetchTickets() {
        try {
            setState(TableState.LOADING);
            setError("");

            const params = buildTableParams(tableQuery);
            const res = await fetch(`/api/software/${software.id}/tickets?${params}`);
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

    const columns: Column<any>[] = useMemo(() => [
        { key: "external_ticket_id", label: "External Ticket ID", width: "160px" },
        { key: "customer_name", label: "Customer", width: "200px", sortable: true },
        { key: "status", label: "Status", width: "180px", render: (row) => <TicketStatusCell status={row.status} />, sortable: true },
        { key: "opened_by_agent_name", label: "Opened By" },
        { key: "last_ticket_update_at", label: "Last Ticket Update", width: "150px", render: (row) => <DateTextWithHover date={row.last_ticket_update_at} withTime reverse /> },
        { key: "last_sync_at", label: "Last Sync", width: "150px", render: (row) => <DateTextWithHover date={row.last_sync_at} withTime reverse /> },
        {
            key: "actions", label: "Actions", render: (row) => (
                <Button
                    height={6}
                    onClick={() => handleRowClick(row)}
                >
                    View
                </Button>
            )
        }
    ], []);

    return (
        <>
            <Button
                size="sm"
                onClick={(e) => setCreateTicketDrawerOpen(true)}
                height={8}
                bgColor="white"
                color="black"
                border="1px solid"
                borderColor="gray.400"
                _hover={{
                    bgColor: "blue.100",
                    transform: "scale(1.05)"
                }}
                marginBottom={4}
            >
                <LuPlus /> Create Ticket
            </Button>

            <DataTable
                id="software_tickets_table"
                data={rows}
                columns={columns}
                defaultColumns={defaultColumns}
                state={state}
                tableQuery={tableQuery}
                tableMeta={tableMeta}
                error={error}
            />

            <CreateTicketDrawer
                open={createTicketDrawerOpen}
                onOpen={setCreateTicketDrawerOpen}
                software={software}
                customer={customer}
            />

            <ViewTicketDrawer
                open={viewDrawerOpen}
                onOpen={setViewDrawerOpen}
                ticket={selectedTicket}
            />
        </>
    )
}