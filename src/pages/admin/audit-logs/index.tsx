import { Column, DataTable } from "@/components/ui/base/DataTable";
import { TableState } from "@/components/ui/base/TableStateWrapper";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { NotAuthorisedPage } from "@/components/ui/NotAuthorisedPage";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { AgentRole } from "@/lib/entities/Agent";
import { AuditAction, AuditLog, formatAuditActionName } from "@/lib/entities/AuditLog";
import { Session } from "@/lib/entities/Session";
import { useTableMeta } from "@/lib/hooks/useTableMeta";
import { Filter, useTableQuery } from "@/lib/hooks/useTableQuery";
import { parseAuditLog } from "@/lib/utils/auditLogParser";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { Heading, HoverCard, Portal, Text } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const PAGE_SIZE = 20;

const columns: Column<AuditLog>[] = [
    { key: "created_at", label: "Time", width: "150px", sortable: true, render: (row) => <DateTextWithHover date={row.created_at} withTime /> },
    { key: "action", label: "Action", render: (row) => formatAuditActionName(row.action) },
    { key: "agent_name", label: "Agent", width: "120px", sortable: true },
    { key: "customer_name", label: "Customer", width: "200px", sortable: true },
    {
        key: "details", label: "Details", render: (row) => {
            const parsed = parseAuditLog(row);

            if (parsed.popover) {
                return (
                    <HoverCard.Root size="sm">
                        <HoverCard.Trigger asChild>
                            <Text width="fit-content">{parsed.text}</Text>
                        </HoverCard.Trigger>
                        <Portal>
                            <HoverCard.Positioner>
                                <HoverCard.Content>
                                    {parsed.popover}
                                </HoverCard.Content>
                            </HoverCard.Positioner>
                        </Portal>
                    </HoverCard.Root>
                )
            }
            return parsed.text;
        }
    }
];

const actionItems = Object.values(AuditAction).map((a) => ({
    label: formatAuditActionName(a),
    value: a.toString()
}));

const tableFilters: Filter<AuditLog>[] = [
    { key: "action", required: "action", label: "Action", type: "select", options: actionItems },
    { key: "agent_name", required: "agent_name", label: "Agent", type: "text" },
    { key: "customer_name", required: "customer_name", label: "Customer", type: "text" },
    { key: "from_date", label: "From Date", type: "date" },
    { key: "to_date", label: "To Date", type: "date" }
];

const defaultColumns = [
    "created_at",
    "action",
    "agent_name",
    "customer_name",
    "details"
]

export default function AuditLogs({ sidebarCollapsed }) {
    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    const [state, setState] = useState<TableState>(TableState.LOADING);
    const [logs, setLogs] = useState<AuditLog[]>([]);

    const [error, setError] = useState<string | null>(null);

    const tableQuery = useTableQuery<AuditLog>(20, tableFilters);
    const { tableMeta, setTableMeta } = useTableMeta();

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchLogs();
        }
    }, [sessionStatus, tableQuery.state.page, tableQuery.state.sort, tableQuery.state.filters]);

    async function fetchLogs() {
        try {
            setState(TableState.LOADING);

            const params = buildTableParams(tableQuery);
            const res = await fetch(`/api/audit-logs?${params}`);
            const data = await res.json();

            if (!res.ok) {
                setState(TableState.FAILED);
                return;
            }

            setLogs(data.rows);
            setTableMeta(data.meta);
            setState(TableState.LOADED);
        } catch (e) {
            console.error(e);
            setState(TableState.FAILED);
            setError(e.message || "An unknown error has occurred");
        }
    }

    if (sessionStatus === "loading" || !router.isReady) {
        return <SkeletonPage />
    }
    if (!session) {
        router.push("/login");
        return null;
    }
    if (session.agent.role !== AgentRole.ADMIN) {
        return <NotAuthorisedPage />
    }
    if (error) {
        return <ErrorPage error={error} />
    }

    return (
        <Page
            title="Audit Logs"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Heading size="3xl" marginBottom={4}>Audit Logs</Heading>

            <DataTable
                id="audit_log_table"
                data={logs}
                columns={columns}
                defaultColumns={defaultColumns}
                state={state}
                tableQuery={tableQuery}
                tableMeta={tableMeta}
            />
        </Page>
    );
}