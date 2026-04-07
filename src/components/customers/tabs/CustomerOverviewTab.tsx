import { LogLevel, LogLevelCell } from "@/components/cell/LogLevelCell";
import { Stat } from "@/components/ui/base/Stat";
import { toaster } from "@/components/ui/base/Toaster";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { BackendLog } from "@/lib/entities/BackendLog";
import { Customer, CustomerStatus } from "@/lib/entities/Customer";
import { RecommendationEvent } from "@/lib/entities/SecurityRecommendation";
import { VulnerabilityEvent } from "@/lib/entities/Vulnerability";
import { findSoftwareInfo } from "@/lib/utils/softwareMap";
import { truncateString } from "@/lib/utils/utils";
import { Box, Flex, Heading, Link, SimpleGrid, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuInfo, LuTriangleAlert } from "react-icons/lu";

interface Props {
    customer: Customer;
    stats: CustomerStatus;
}

export function CustomerOverviewTab({
    customer,
    stats
}: Props) {
    const [events, setEvents] = useState<VulnerabilityEvent[]>([]);
    const [recEvents, setRecEvents] = useState<RecommendationEvent[]>([]);
    const [recentLogs, setRecentLogs] = useState<BackendLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadingImpactStats, setLoadingImpactStats] = useState(false);
    const [impactStats, setImpactStats] = useState(null);

    useEffect(() => {
        // fetchRecentEvents();
        fetchRecentLogs();
        fetchImpactStats();
    }, []);

    async function fetchRecentEvents() {
        setLoading(true);

        const params = new URLSearchParams();

        params.append("customerId", customer.id.toString());

        const url = `/api/vulnerabilities/recent-events?${params.toString()}`

        try {
            const res = await fetch(url);
            const data = await res.json();

            if (res.ok) {
                // setEvents(data);
            } else {
                toaster.create({ type: "error", title: data?.error ?? "Failed to fetch events" });
            }
        } finally {
            setLoading(false);
        }
    }

    async function fetchRecentLogs() {
        try {
            const res = await fetch(`/api/customers/${customer.id}/recent-logs`);
            const data = await res.json();

            if (res.ok) {
                setRecentLogs(data);
            } else {
                toaster.create({ type: "error", title: data?.error ?? "Failed to fetch logs" });
            }
        } catch (e) {

        }
    }

    async function fetchImpactStats() {
        setLoadingImpactStats(true);
        setError(null);

        try {
            const res = await fetch(`/api/customers/${customer.id}/impact-stats`);
            const data = await res.json();

            if (res.ok) {
                setImpactStats(data);
            } else {
                toaster.create({ type: "error", title: data?.error ?? "Failed to fetch impact stats" });
                setError("Failed to fetch impact stats");
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoadingImpactStats(false);
        }
    }

    return (
        <>
            <Flex gap={4} flexWrap="wrap" marginBottom={4}>
                <Stat
                    icon={<LuInfo />}
                    label="Total CVEs"
                    value={stats?.totalCves?.toString()}
                    bgColor="blue.100"
                    color="blue.700"
                />
                <Stat
                    icon={<LuTriangleAlert />}
                    label="Critical CVEs"
                    value={stats?.totalCriticalCves?.toString()}
                    bgColor="red.100"
                    color="red.700"
                />
                <Stat
                    icon={<LuTriangleAlert />}
                    label="Public Exploit"
                    value={stats?.totalCvesWithPublicExploit?.toString()}
                    bgColor="orange.100"
                    color="orange.700"
                />
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} marginBottom={6}>
                <Box
                    bgColor="white"
                    paddingY={4}
                    paddingX={6}
                    borderRadius={8}
                    position="relative"
                >
                    <Heading size="xl" marginBottom={2}>Top 5 Devices</Heading>

                    <LoadingWrapper
                        loading={loadingImpactStats}
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
                                {impactStats?.topDevices?.map(device => (
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
                        loading={loadingImpactStats}
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
                                {impactStats?.topSoftware?.map(software => {
                                    const softwareMapItem = findSoftwareInfo(software);
                                    return (
                                        <Table.Row key={software.id}>
                                            <Table.Cell>
                                                <Link href={`/software/${software.id}?customer=${customer.id}`}>{truncateString(softwareMapItem.name, 40)}</Link>
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
                marginBottom={4}
            >
                <Heading size="xl" marginBottom={0.5}>Recent Logs</Heading>
                <Text fontSize="13px" marginBottom={5} color="gray.500">
                    Debug logs are excluded. To view full logs, visit the <Link href="/backend-logs">Backend Logs</Link> page.
                </Text>

                <Box
                    maxHeight="300px"
                    overflowY="scroll"
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
                            {recentLogs.map((row) => (
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
                </Box>
            </Box>

            {/* <Box
                bgColor="white"
                borderRadius={8}
                paddingY={4}
                paddingX={6}
                marginBottom={4}
            >
                <Heading size="xl" marginBottom={4}>Recent Events</Heading>

                <Table.Root size="sm">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeader width="250px">Event</Table.ColumnHeader>
                            <Table.ColumnHeader width="150px">Date</Table.ColumnHeader>
                            <Table.ColumnHeader width="190px">CVE Number</Table.ColumnHeader>
                            <Table.ColumnHeader>Old Value</Table.ColumnHeader>
                            <Table.ColumnHeader>New Value</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {events.map((row) => (
                            <Table.Row key={row.id}>
                                <Table.Cell>{row.event_type}</Table.Cell>
                                <Table.Cell>
                                    <DateTextWithHover date={row.created_at} reverse withTime />
                                </Table.Cell>
                                <Table.Cell>{row.cve_id}</Table.Cell>
                                <Table.Cell>{row.old_value ?? "-"}</Table.Cell>
                                <Table.Cell>{row.new_value ?? "-"}</Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            </Box> */}

            {/* <Box
                bgColor="white"
                borderRadius={8}
                paddingY={4}
                paddingX={6}
            >
                <Heading size="xl" marginBottom={4}>Recent Security Recommendation Events</Heading>

                <Table.Root size="sm">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeader width="250px">Field</Table.ColumnHeader>
                            <Table.ColumnHeader width="150px">Date</Table.ColumnHeader>
                            <Table.ColumnHeader width="150px">Recommendation ID</Table.ColumnHeader>
                            <Table.ColumnHeader>Old Value</Table.ColumnHeader>
                            <Table.ColumnHeader>New Value</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {recEvents.map((row) => (
                            <Table.Row key={row.id}>
                                <Table.Cell>{row.field_name}</Table.Cell>
                                <Table.Cell>
                                    <DateTextWithHover date={row.created_at} reverse withTime />
                                </Table.Cell>
                                <Table.Cell>{row.recommendation_id}</Table.Cell>
                                <Table.Cell>{row.old_value ?? "-"}</Table.Cell>
                                <Table.Cell>{row.new_value ?? "-"}</Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            </Box> */}
        </>
    )
}