import { LogLevel, LogLevelCell } from "@/components/cell/LogLevelCell";
import { Column, DataTable, Filter } from "@/components/ui/base/DataTable";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { BackendLog } from "@/lib/entities/BackendLog";
import { Session } from "@/lib/entities/Session";
import { useTableQuery } from "@/lib/hooks/useTableQuery";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { Heading, Text } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const PAGE_SIZE = 30;

const columns: Column<BackendLog>[] = [
    { key: "id", label: "ID", width: "100px", sortable: true },
    { key: "created_at", label: "Time", width: "150px", sortable: true, render: (row) => <DateTextWithHover date={row.created_at} withTime /> },
    { key: "level", label: "Level", width: "80px", render: (row) => <LogLevelCell level={row.level as LogLevel} />, sortable: true },
    { key: "text", label: "Text", render: (row) => ( <Text color={row.level === "DEBUG" ? "gray.500" : undefined}>{row.text}</Text>) },
    { key: "source", label: "Source", render: (row) => ( <Text color={row.level === "DEBUG" ? "gray.500" : undefined}>{row.source}</Text>), sortable: true },
    { key: "customer_name", label: "Customer", width: "200px", render: (row) => ( <Text color={row.level === "DEBUG" ? "gray.500" : undefined}>{row.customer_name}</Text>), sortable: true }
];

const levelOptions = [
    { label: "INFO", value: "INFO" },
    { label: "WARN", value: "WARN" },
    { label: "ERROR", value: "ERROR" },
    { label: "DEBUG", value: "DEBUG" }
]

const filtersConfig: Filter<BackendLog>[] = [
    { key: "customer_name", required: "customer_name", label: "Customer", type: "text" },
    { key: "level", required: "level", label: "Level", type: "select", options: levelOptions },
    { key: "source", required: "source", label: "Source", type: "text" },
    { key: "text", required: "text", label: "Text", type: "text" },
    { key: "from_date", label: "From Date", type: "date" },
    { key: "to_date", label: "To Date", type: "date" },
];

const defaultColumns = [
    "created_at",
    "level",
    "text",
    "source",
    "customer_name"
]

export default function BackendLogs({ sidebarCollapsed }) {
    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    const {
        page,
        filters,
        sort,
        setPage,
        setFilters,
        setSort,
    } = useTableQuery<BackendLog>();

    const [logs, setLogs] = useState<BackendLog[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (sessionStatus !== "authenticated") {
            return;
        }
        fetchLogs();
    }, [sessionStatus, page, filters, sort]);

    async function fetchLogs() {
        setLoading(true);
        try {
            const params = buildTableParams({
                page,
                pageSize: PAGE_SIZE,
                filters,
                sort: sort.key ? { 
                    key: String(sort.key), 
                    direction: sort.direction 
                } : undefined
            });

            const res = await fetch(`/api/logs?${params}`);

            if (!res.ok) {
                throw new Error("Failed to fetch logs");
            }

            const data = await res.json();

            setLogs(data.logs);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (sessionStatus === "loading" || !router.isReady) {
        return <SkeletonPage />
    }

    if (!session) {
        router.push("/login");
        return null;
    }

    if (error) {
        return <ErrorPage error={error} />
    }

    return (
        <Page
            title="Backend Logs"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Heading size="3xl" marginBottom={4}>Backend Logs</Heading>

            <DataTable
                id="backend_log_table"
                data={logs}
                columns={columns}
                defaultColumns={defaultColumns}
                filters={filtersConfig}
                filterState={filters}
                onFilterChange={setFilters}
                onSortChange={(key, direction) => setSort(key)}
                onPageChange={setPage}
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
            />
        </Page>
    );
}