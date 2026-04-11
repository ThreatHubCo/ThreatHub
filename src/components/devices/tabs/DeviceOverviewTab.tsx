import { DataListItem } from "@/components/ui/base/DataListItem";
import { Stat } from "@/components/ui/base/Stat";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { EPSSDisplay } from "@/components/ui/EPSSDisplay";
import { BooleanCell } from "@/components/cell/BooleanCell";
import { FullDevice } from "@/lib/entities/Device";
import { getRiskColors } from "@/lib/utils/statColorUtils";
import { Box, DataList, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuTriangleAlert } from "react-icons/lu";
import { WhiteBox } from "@/components/ui/box/WhiteBox";
import { Progress } from "@/components/ui/base/Progress";

interface Props {
    device: FullDevice;
    stats: any;
}

export function DeviceOverviewTab({
    device,
    stats
}: Props) {
    const [loading, setLoading] = useState(true);

    const epssColors = getRiskColors(stats?.highestCveEpss, "epss");
    const severityColors = getRiskColors(stats?.highestCveSeverity, "severity");
    const cve = stats?.cveBreakdown[0];

    return (
        <>
            <Flex 
                gap={2}
                flexWrap="wrap" 
                marginBottom={4}
            >
                <Stat
                    icon={<LuTriangleAlert />}
                    label="Critical CVEs"
                    value={stats?.totalCriticalCves.toString()}
                    bgColor="red.100"
                    color="red.700"
                />
                <Stat
                    icon={<LuTriangleAlert />}
                    label="High CVEs"
                    value={stats?.totalHighCves.toString()}
                    bgColor="red.100"
                    color="red.700"
                />
                <Stat
                    icon={<LuTriangleAlert />}
                    label="Public Exploit"
                    value={stats?.totalPublicExploit.toString()}
                    bgColor="orange.100"
                    color="orange.700"
                />
                <Stat
                    icon={<LuTriangleAlert />}
                    label="Highest Epss"
                    value={<EPSSDisplay epss={stats?.highestCveEpss} />}
                    {...epssColors}
                />
                <Stat
                    icon={<LuTriangleAlert />}
                    label="Highest Severity"
                    value={stats?.highestCveSeverity?.toString() ?? "-"}
                    {...severityColors}
                />
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <WhiteBox>
                    <Heading size="xl" marginBottom={1}>Information</Heading>

                    <Flex gap={1} color="gray.600" lineHeight="1.3" fontSize="14px" marginBottom={6}>
                        Last synced <DateTextWithHover date={device.last_sync_at} reverse withTime />
                    </Flex>

                    <DataList.Root orientation="horizontal" gap={2} divideY="1px" divideStyle={"margin-top:10px"}>
                        <DataListItem label="Last Seen" value={<DateTextWithHover date={device.last_seen_at} reverse withTime />} />
                        <DataListItem pt={1.5} label="OS Platform" value={device.os_platform} />
                        <DataListItem pt={1.5} label="OS Version" value={device.os_version} />
                        <DataListItem pt={1.5} label="Customer" value={device.customer_name} />
                        <DataListItem pt={1.5} label="Entra Joined?" value={<BooleanCell value={device.is_aad_joined} fontSize="12px" lineHeight="1.4" />} />
                        <DataListItem pt={1.5} label="Entra Device ID" value={device.aad_device_id ?? "-"} />
                        <DataListItem pt={1.5} label="Defender ID" value={device.machine_id ?? "-"} wordBreak="break-all" />
                    </DataList.Root>
                </WhiteBox>

                <WhiteBox>
                    <Heading size="xl" marginBottom={0.5}>CVE Severity Breakdown</Heading>

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
                </WhiteBox>
            </SimpleGrid>
        </>
    )
}