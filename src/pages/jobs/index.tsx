import { LogLevel, LogLevelCell } from "@/components/cell/LogLevelCell";
import { Filter } from "@/components/ui/base/DataTable";
import { toaster } from "@/components/ui/base/Toaster";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { BackendLog } from "@/lib/entities/BackendLog";
import { formatScanStatus, formatScanType, ScanStatus, ScanType } from "@/lib/entities/ScanJob";
import { Session } from "@/lib/entities/Session";
import { useScanJobs } from "@/lib/hooks/useScanJobs";
import { useTableQuery } from "@/lib/hooks/useTableQuery";
import { startScanJob } from "@/lib/scan/scanJobHelper";
import { Box, Button, Flex, Heading, Stack, StackSeparator, Table, Text } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const columns = [
    { key: "id", label: "ID", width: "100px", sortable: true },
    { key: "created_at", label: "Time", width: "150px", sortable: true, render: (row) => <DateTextWithHover date={row.created_at} withTime /> },
    { key: "level", label: "Level", width: "80px", render: (row) => <LogLevelCell level={row.level as LogLevel} />, sortable: true },
    { key: "text", label: "Text", render: (row) => (<Text color={row.level === "DEBUG" ? "gray.500" : undefined}>{row.text}</Text>) },
    { key: "source", label: "Source", render: (row) => (<Text color={row.level === "DEBUG" ? "gray.500" : undefined}>{row.source}</Text>), sortable: true },
    { key: "customer_name", label: "Customer", width: "200px", render: (row) => (<Text color={row.level === "DEBUG" ? "gray.500" : undefined}>{row.customer_name}</Text>), sortable: true }
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

// TODO
export default function Jobs({ sidebarCollapsed }) {
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

    const [rows, setRows] = useState<any[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const jobs = useScanJobs();

    useEffect(() => {
        if (sessionStatus !== "authenticated") {
            return;
        }
        // fetchJobs();
    }, [sessionStatus, page, filters, sort]);

    // async function fetchJobs() {
    //     setLoading(true);
    //     try {
    //         const params = buildTableParams({
    //             page,
    //             pageSize: 30,
    //             filters,
    //             sort: sort.key ? { key: String(sort.key), direction: sort.direction } : undefined,
    //         });

    //         const res = await fetch(`/api/scan?${params}`);
    //         if (!res.ok) throw new Error("Failed to fetch jobs");

    //         const data = await res.json();

    //         setLogs(data.jobs);
    //         setTotalPages(data.totalPages);
    //         setTotalItems(data.totalItems);
    //     } catch (err: any) {
    //         setError(err.message);
    //     } finally {
    //         setLoading(false);
    //     }
    // }

    async function startJob(type: ScanType) {
        try {
            const job = await startScanJob({
                type,
                targetType: null,
                targetId: null
            });
            if (job.ok) {
                toaster.create({ type: "success", title: "Job started" });
            } else {
                toaster.create({ type: "error", title: job.data?.error ?? "Failed to start job" });
            }
        } catch (e) {
            console.error(e);
            toaster.create({ type: "error", title: e.message });
        }
    }

    function isRunning(type: ScanType) {
        const runningJobs = jobs.filter(j => j.status === ScanStatus.RUNNING || j.status === ScanStatus.PENDING).filter(j => j.type === type);
        return runningJobs.length !== 0;
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
            title="Jobs"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Heading size="3xl" marginBottom={4}>Jobs</Heading>

            <Flex gap={4} marginBottom={4} flexWrap="wrap">
                <Button
                    size="sm"
                    onClick={() => startJob(ScanType.GLOBAL_VULN_CATALOG)}
                    height={8}
                    bgColor="white"
                    color="black"
                    border="1px solid"
                    borderColor="gray.400"
                    disabled={isRunning(ScanType.GLOBAL_VULN_CATALOG)}
                    _hover={{
                        bgColor: "blue.100",
                        transform: "scale(1.05)"
                    }}
                >
                    Global Catalog&nbsp;
                    {!isRunning(ScanType.GLOBAL_VULN_CATALOG) ? "Sync" : "Sync in progress"}
                </Button>

                <Button
                    size="sm"
                    onClick={() => startJob(ScanType.ALL_DEVICES)}
                    height={8}
                    bgColor="white"
                    color="black"
                    border="1px solid"
                    borderColor="gray.400"
                    disabled={isRunning(ScanType.ALL_DEVICES)}
                    _hover={{
                        bgColor: "blue.100",
                        transform: "scale(1.05)"
                    }}
                >
                    Global Devices&nbsp;
                    {!isRunning(ScanType.ALL_DEVICES) ? "Sync" : "Sync in progress"}
                </Button>

                <Button
                    size="sm"
                    onClick={() => startJob(ScanType.ALL_TICKETS_GLOBAL)}
                    height={8}
                    bgColor="white"
                    color="black"
                    border="1px solid"
                    borderColor="gray.400"
                    disabled={isRunning(ScanType.ALL_TICKETS_GLOBAL)}
                    _hover={{
                        bgColor: "blue.100",
                        transform: "scale(1.05)"
                    }}
                >
                    Global Ticket&nbsp;
                    {!isRunning(ScanType.ALL_TICKETS_GLOBAL) ? "Sync" : "Sync in progress"}
                </Button>

                <Button
                    size="sm"
                    onClick={() => startJob(ScanType.DEVICE_CLEANUP)}
                    height={8}
                    bgColor="white"
                    color="black"
                    border="1px solid"
                    borderColor="gray.400"
                    disabled={isRunning(ScanType.DEVICE_CLEANUP)}
                    _hover={{
                        bgColor: "blue.100",
                        transform: "scale(1.05)"
                    }}
                >
                    Device Cleanup&nbsp;
                    {!isRunning(ScanType.DEVICE_CLEANUP) ? "Sync" : "Sync in progress"}
                </Button>
            </Flex>

            <Box
                bgColor="white"
                paddingY={4}
                paddingX={6}
                borderRadius={8}
                marginTop={4}
            >
                <Heading size="xl" marginBottom={4}>Running Jobs</Heading>

                {jobs.length === 0 ? (
                    <Text>No running jobs</Text>
                ) : (
                    <Table.Root size="sm">
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeader width="120px">Date</Table.ColumnHeader>
                                <Table.ColumnHeader width="180px">Job</Table.ColumnHeader>
                                <Table.ColumnHeader width="110px">Status</Table.ColumnHeader>
                                <Table.ColumnHeader width="130px">Requested By</Table.ColumnHeader>
                                <Table.ColumnHeader>Text</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {jobs
                                .sort((a, b) => {
                                    const aDate = new Date(Number(a.createdAt));
                                    const bDate = new Date(Number(b.createdAt));
                                    return bDate.getTime() - aDate.getTime();
                                })
                                .map(job => (
                                    <Table.Row key={job.id}>
                                        <Table.Cell>
                                            <DateTextWithHover date={new Date(Number(job.createdAt))} reverse withTime />
                                        </Table.Cell>
                                        <Table.Cell>{formatScanType(job.type)}</Table.Cell>
                                        <Table.Cell>{formatScanStatus(job.status)} {job.progress ? `${job.progress}%` : ""}</Table.Cell>
                                        <Table.Cell>{job.requestedBy || "System"}</Table.Cell>
                                        <Table.Cell>{job.message}</Table.Cell>
                                    </Table.Row>
                                ))}
                        </Table.Body>
                    </Table.Root>
                )}
            </Box>

            {/* <DataTable
                id="jobs_table"
                data={rows}
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
            /> */}
        </Page>
    );
}