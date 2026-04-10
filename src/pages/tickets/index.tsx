import { TicketStatusCell } from "@/components/cell/TicketStatusCell";
import { ViewTicketDrawer } from "@/components/remediation/ViewTicketDrawer";
import { Column, DataTable, Filter } from "@/components/ui/base/DataTable";
import { Stat } from "@/components/ui/base/Stat";
import { toaster } from "@/components/ui/base/Toaster";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { RemediationTicket, RemediationTicketStatus } from "@/lib/entities/RemediationTicket";
import { Session } from "@/lib/entities/Session";
import { useTableQuery } from "@/lib/hooks/useTableQuery";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { Button, Flex, Heading } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { LuInfo } from "react-icons/lu";

const statusItems = [
    { label: "Open", value: RemediationTicketStatus.OPEN },
    { label: "Closed (Grace Period)", value: RemediationTicketStatus.CLOSED_GRACE_PERIOD },
    { label: "Closed (Permanently)", value: RemediationTicketStatus.CLOSED },
    { label: "Unknown", value: RemediationTicketStatus.UNKNOWN }
];

const filtersConfig: Filter<any>[] = [
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

export default function TicketSummary({ sidebarCollapsed }: { sidebarCollapsed: boolean }) {
    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<RemediationTicket | null>(null);

    const [rows, setRows] = useState<RemediationTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(1);
    const [loadingStats, setLoadingStats] = useState(true);
    const [stats, setStats] = useState(null);

    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    const {
        page,
        filters,
        sort,
        setPage,
        setFilters,
        setSort,
    } = useTableQuery<RemediationTicket>();

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchTickets();
        }
    }, [sessionStatus, page, filters, sort]);

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchStats();
        }
    }, [sessionStatus]);

    async function fetchTickets() {
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

            const res = await fetch(`/api/tickets?${params}`);

            if (!res.ok) {
                throw new Error("Failed to fetch tickets");
            }

            const data = await res.json();

            setRows(data.tickets);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        } catch (e) {
            console.error(e);
            setError(e.message || "An unknown error has occurred");
        } finally {
            setLoading(false);
        }
    }

    async function fetchStats() {
        setLoadingStats(true);

        try {
            const res = await fetch("/api/tickets/stats");

            if (!res.ok) {
                throw new Error("Failed to fetch ticket stats");
            }

            const data = await res.json();
            setStats(data);
        } catch (e) {
            console.error(e);
            toaster.create({ title: e.message || "An unknown error has occurred", type: "error" });
        } finally {
            setLoadingStats(false);
        }
    }

    const columns: Column<RemediationTicket>[] = useMemo(() => [
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
                    onClick={() => {
                        setSelectedTicket(row);
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
            title="Tickets"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Heading size="3xl" marginBottom={4}>Tickets</Heading>

            <Flex gap={4} marginBottom={4} flexWrap="wrap">
                <Stat
                    icon={<LuInfo />}
                    label="Open Tickets"
                    value={loadingStats ? "-" : stats?.openTickets.toString()}
                    bgColor="blue.100"
                    color="blue.700"
                />
                <Stat
                    icon={<LuInfo />}
                    label="Closed Tickets"
                    value={loadingStats ? "-" : stats?.closedTickets.toString()}
                    bgColor="blue.100"
                    color="blue.700"
                />
                <Stat
                    icon={<LuInfo />}
                    label="Grace Period Tickets"
                    value={loadingStats ? "-" : stats?.closedGracePeriodTickets.toString()}
                    bgColor="blue.100"
                    color="blue.700"
                />
                <Stat
                    icon={<LuInfo />}
                    label="Stale Tickets"
                    value={loadingStats ? "-" : stats?.staleTickets.toString()}
                    bgColor="blue.100"
                    color="blue.700"
                />
            </Flex>

            <DataTable
                id="global_tickets_table"
                data={rows}
                columns={columns}
                defaultColumns={defaultColumns}
                filters={filtersConfig}
                filterState={filters}
                sort={sort}
                onFilterChange={setFilters}
                onSortChange={(key, direction) => setSort(key as keyof RemediationTicket)}
                onPageChange={setPage}
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                loading={loading}
                error={error}
            />

            <ViewTicketDrawer
                open={viewDrawerOpen}
                onOpen={setViewDrawerOpen}
                ticket={selectedTicket}
            />
        </Page>
    );
}
