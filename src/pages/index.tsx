import { LogLevel, LogLevelCell } from "@/components/cell/LogLevelCell";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { BackendLog } from "@/lib/entities/BackendLog";
import { Session } from "@/lib/entities/Session";
import { useScanJobs } from "@/lib/hooks/useScanJobs";
import { findSoftwareInfo } from "@/lib/utils/softwareMap";
import { truncateString } from "@/lib/utils/utils";
import { Box, Flex, Heading, Link, SimpleGrid, Stack, StackSeparator, Table, Text } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Index({ sidebarCollapsed }) {
    const jobs = useScanJobs();
    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/dashboard");

            if (!response.ok) {
                throw new Error("Failed to fetch dashboard data");
            }

            const data = await response.json();
            setData(data);
        } catch (e) {
            console.error(e);
            setError(e.message || "An unknown error has occurred");
        } finally {
            setLoading(false);
        }
    }

    if (sessionStatus === "loading") {
        return <SkeletonPage />
    }

    if (!session) {
        router.push("/login");
        return false;
    }

    return (
        <Page
            title="Home"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Heading size="3xl" marginBottom={4}>Dashboard</Heading>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <Box
                    bgColor="white"
                    paddingY={4}
                    paddingX={6}
                    borderRadius={8}
                    position="relative"
                >
                    <Heading size="xl" marginBottom={2}>Top 5 Devices</Heading>

                    <LoadingWrapper
                        loading={loading}
                        error={error}
                        marginTop={4}
                    >
                        <Table.Root size="sm">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader>Device</Table.ColumnHeader>
                                    <Table.ColumnHeader>Platform</Table.ColumnHeader>
                                    <Table.ColumnHeader width="80px">Critical CVEs</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {data?.topDevices?.map(device => (
                                    <Table.Row key={device.id}>
                                        <Table.Cell>
                                            <Link href={`/devices/${device.id}`}>{truncateString(device.dns_name, 30)}</Link>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Text>{truncateString(device.os_platform, 20)}</Text>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Text>{device.critical_cve_count}</Text>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </LoadingWrapper>
                </Box>

                <Box
                    bgColor="white"
                    paddingY={4}
                    paddingX={6}
                    borderRadius={8}
                >
                    <Heading size="xl" marginBottom={2}>Top 5 Software</Heading>

                    <LoadingWrapper
                        loading={loading}
                        error={error}
                        marginTop={4}
                    >
                        <Table.Root size="sm">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader>Name</Table.ColumnHeader>
                                    <Table.ColumnHeader width="150px">Vendor</Table.ColumnHeader>
                                    <Table.ColumnHeader width="80px">Critical CVEs</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {data?.topSoftware?.map(software => {
                                    return (
                                        <Table.Row key={software.id}>
                                            <Table.Cell>
                                                <Link href={`/software/${software.id}`}>{truncateString(software.name, 40)}</Link>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text>{truncateString(software.vendor, 20)}</Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text>{software.critical_count}</Text>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table.Root>
                    </LoadingWrapper>
                </Box>
            </SimpleGrid>

            <Box
                bgColor="white"
                borderRadius={8}
                paddingY={4}
                paddingX={6}
                marginTop={4}
            >
                <Heading size="xl" marginBottom={0.5}>Recent Error Logs</Heading>
                <Text fontSize="13px" marginBottom={5} color="gray.500">
                    To view full logs, visit the <Link href="/backend-logs">Backend Logs</Link> page.
                </Text>

                <Box
                    maxHeight="300px"
                    overflowY="scroll"
                >
                    <LoadingWrapper
                        loading={loading}
                        error={error}
                        marginTop={4}
                    >
                        <Table.Root size="sm">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader width="120px">Date</Table.ColumnHeader>
                                    <Table.ColumnHeader width="80px">Level</Table.ColumnHeader>
                                    <Table.ColumnHeader width="160px">Source</Table.ColumnHeader>
                                    <Table.ColumnHeader>Text</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {data?.recentLogs.map((row) => (
                                    <Table.Row key={row.id}>
                                        <Table.Cell>
                                            <DateTextWithHover date={row.created_at} reverse withTime />
                                        </Table.Cell>
                                        <Table.Cell paddingRight="20px">
                                            <LogLevelCell level={row.level as LogLevel} />
                                        </Table.Cell>
                                        <Table.Cell paddingRight="30px">{row.source}</Table.Cell>
                                        <Table.Cell>{row.text}</Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </LoadingWrapper>
                </Box>
            </Box>

            <Box
                bgColor="white"
                paddingY={4}
                paddingX={6}
                borderRadius={8}
                marginTop={4}
            >
                <Heading size="xl" marginBottom={2}>Running Jobs</Heading>

                {jobs.length === 0 ? (
                    <Text>No running jobs</Text>
                ) : (
                    <Stack gap={2} separator={<StackSeparator />}>
                        {jobs.map(job => (
                            <Flex key={job.id} gap={4}>
                                <DateTextWithHover date={job.createdAt} reverse />
                                <Text>{job.type}</Text>
                                <Text>{job.status}</Text>
                                <Text>{job.requestedBy}</Text>
                                <Text>{job.message}</Text>
                                <Text>{job.progress}%</Text>
                            </Flex>
                        ))}
                    </Stack>
                )}
            </Box>
        </Page>
    )
}