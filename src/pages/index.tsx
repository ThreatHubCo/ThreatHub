import { LogLevel, LogLevelCell } from "@/components/cell/LogLevelCell";
import { ScanJobStatusCell } from "@/components/cell/ScanJobStatusCell";
import { Progress } from "@/components/ui/base/Progress";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { formatScanStatus, formatScanType } from "@/lib/entities/ScanJob";
import { Session } from "@/lib/entities/Session";
import { useScanJobs } from "@/lib/hooks/useScanJobs";
import { truncateString } from "@/lib/utils/utils";
import { Box, Flex, Grid, GridItem, Heading, Link, SimpleGrid, Stack, StackSeparator, Table, Text } from "@chakra-ui/react";
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

    const cve = data?.cveBreakdown[0];
    const osData = data?.osBreakdown || [];

    return (
        <Page
            title="Home"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Heading size="3xl" marginBottom={4}>Dashboard</Heading>

            <Grid
                gridTemplateColumns={{ base: "1fr", lg: "1fr 300px" }}
                gap={6}
                minWidth={0}
                width="full"
            >
                <GridItem width="full" minWidth={0}>
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
                                                <Table.Cell fontSize="12px" lineHeight={1.3}>{row.text}</Table.Cell>
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
                        <Heading size="xl" marginBottom={4}>Running Jobs</Heading>

                        {jobs.length === 0 ? (
                            <Text>No running jobs</Text>
                        ) : (
                            <Box
                                maxHeight="300px"
                                overflowY="scroll"
                            >
                                <Table.Root size="sm">
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.ColumnHeader width="120px">Date</Table.ColumnHeader>
                                            <Table.ColumnHeader width="160px">Job</Table.ColumnHeader>
                                            <Table.ColumnHeader width="100px">Status</Table.ColumnHeader>
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
                                                    <Table.Cell>
                                                        <ScanJobStatusCell value={job.status} />
                                                    </Table.Cell>
                                                    <Table.Cell>{formatScanStatus(job.status)} {job.progress ? `${job.progress}%` : ""}</Table.Cell>
                                                    <Table.Cell>{job.message}</Table.Cell>
                                                </Table.Row>
                                            ))}
                                    </Table.Body>
                                </Table.Root>
                            </Box>
                        )}
                    </Box>
                </GridItem>

                <GridItem width="full" minWidth={0}>
                    <Stack gap={4}>
                        <Box
                            bgColor="white"
                            paddingY={4}
                            paddingX={6}
                            borderRadius={8}
                        >
                            <Heading size="xl" marginBottom={0.5}>CVE Severity Breakdown</Heading>

                            <LoadingWrapper
                                loading={loading}
                                error={error}
                                marginTop={4}
                            >
                                <Text fontSize="13px" color="gray.500" marginBottom={6}>
                                    All {cve?.total.toLocaleString()} active vulnerabilities
                                </Text>

                                <Stack gap={4}>
                                    {[
                                        { label: "Critical", count: cve?.total_critical, color: "red.500" },
                                        { label: "High", count: cve?.total_high, color: "orange.400" },
                                        { label: "Medium", count: cve?.total_medium, color: "yellow.400" },
                                        { label: "Low", count: cve?.total_low, color: "gray.400" }
                                    ].map((item) => {
                                        const totalVulnerabilities = cve?.total || 0;
                                        const itemPercent = totalVulnerabilities > 0 ? (item.count / totalVulnerabilities) * 100 : 0;

                                        return (
                                            <Box key={item.label}>
                                                <Flex justify="space-between" align="center" mb={1}>
                                                    <Flex align="center" gap={2}>
                                                        <Box width={3} height={3} borderRadius="full" bg={item.color} />
                                                        <Text fontSize="sm" fontWeight="medium">{item.label}</Text>
                                                    </Flex>
                                                    <Text fontWeight="bold">{item.count?.toLocaleString()}</Text>
                                                </Flex>
                                                <Progress
                                                    value={itemPercent}
                                                    colorPalette={item.label === "Critical" ? "red" : "gray"}
                                                    size="xs"
                                                    borderRadius="full"
                                                    color={item.color}
                                                />
                                            </Box>
                                        )
                                    })}
                                </Stack>
                            </LoadingWrapper>
                        </Box>

                        <Box
                            bgColor="white"
                            paddingY={4}
                            paddingX={6}
                            borderRadius={8}
                        >
                            <Heading size="xl" marginBottom={6}>OS Distribution</Heading>

                            <LoadingWrapper
                                loading={loading}
                                error={error}
                                marginTop={4}
                            >
                                <Stack
                                    gap={5}
                                    maxHeight="500px"
                                    overflowY="scroll"
                                    css={{
                                        "::-webkit-scrollbar": {
                                            display: "none"
                                        }
                                    }}
                                    scrollbarWidth="none"
                                >
                                    {osData.map((os) => {
                                        const grandTotal = data?.osBreakdown.reduce((acc, curr) => acc + curr.total_devices, 0) || 1;
                                        const fleetShare = (os.total_devices / grandTotal) * 100;
                                        const vulnerableShare = (os.vulnerable_devices / grandTotal) * 100;

                                        return (
                                            <Box key={os.os_platform}>
                                                <Flex justify="space-between" align="end" mb={1}>
                                                    <Text fontWeight="bold" fontSize="sm">{os.os_platform}</Text>
                                                    <Text fontSize="xs" color="gray.600">
                                                        <strong style={{ color: "#DD6B20" }}>{os.vulnerable_devices}</strong> vulnerable / {os.total_devices} total
                                                    </Text>
                                                </Flex>

                                                <Progress
                                                    size="xs"
                                                    borderRadius="full"
                                                    bg="gray.100"
                                                    ranges={[
                                                        { value: vulnerableShare, color: "#DD6B20" },
                                                        { value: fleetShare, color: "blue.300" }
                                                    ]}
                                                />

                                                <Flex justify="space-between" mt={1}>
                                                    <Text fontSize="10px" color="gray.400">
                                                        {((os.total_devices / grandTotal) * 100).toFixed(1)}% of inventory
                                                    </Text>
                                                    <Text fontSize="10px" color="gray.500" fontWeight="bold">
                                                        {((os.vulnerable_devices / os.total_devices) * 100).toFixed(0)}% at risk
                                                    </Text>
                                                </Flex>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </LoadingWrapper>
                        </Box>
                    </Stack>
                </GridItem>
            </Grid>
        </Page>
    )
}