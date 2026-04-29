import { Progress } from "@/components/ui/base/Progress";
import { Stat } from "@/components/ui/base/Stat";
import { toaster } from "@/components/ui/base/Toaster";
import { WhiteBox } from "@/components/ui/box/WhiteBox";
import { EPSSDisplay } from "@/components/ui/EPSSDisplay";
import { Customer } from "@/lib/entities/Customer";
import { Software } from "@/lib/entities/Software";
import { getRiskColors } from "@/lib/utils/statColorUtils";
import { Box, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuTriangleAlert } from "react-icons/lu";
import { AutoTicketEscalationToggle } from "../AutoTicketEscalationToggle";
import SoftwareTotalsChart from "../SoftwareTotalsChart";

interface Props {
    software: Software;
    stats: any;
    customer?: Customer;
}

export function SoftwareOverviewTab({
    software,
    stats,
    customer
}: Props) {
    const [loading, setLoading] = useState(true);
    const [enabled, setEnabled] = useState(software.auto_ticket_escalation_enabled);

    async function onChange(value: boolean) {
        const response = await fetch(`/api/software/${software.id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                auto_ticket_escalation_enabled: value
            })
        });

        const json = await response.json();

        if (json?.error) {
            toaster.create({ title: "Failed to change ticket escalation settings", description: json.error, type: "error" });
        }
        if (!response.ok) {
            toaster.create({ title: "Unknown error updating ticket escalation settings", type: "error" });
        }

        setEnabled(value);
        toaster.create({ title: `${value ? "Enabled" : "Disabled"} automatic ticket escalation`, type: "success" });
    }

    const epssColors = getRiskColors(stats?.highestCveEpss, "epss");
    const severityColors = getRiskColors(stats?.highestCveSeverity, "severity");
    const cve = stats?.cveBreakdown[0];

    return (
        <>
            <Flex gap={2} flexWrap="wrap" marginBottom={4}>
                <Stat
                    icon={<LuTriangleAlert />}
                    label="Critical CVEs"
                    value={stats?.totalCriticalCves?.toString()}
                    bgColor="red.100"
                    color="red.700"
                    flex={{ base: "100%", md: "0 0 220px" }}
                />
                <Stat
                    icon={<LuTriangleAlert />}
                    label="High CVEs"
                    value={stats?.totalHighCves?.toString()}
                    bgColor="red.100"
                    color="red.700"
                    flex={{ base: "100%", md: "0 0 220px" }}
                />
                <Stat
                    icon={<LuTriangleAlert />}
                    label="Public Exploit"
                    value={stats?.totalPublicExploit?.toString()}
                    bgColor="orange.100"
                    color="orange.700"
                    flex={{ base: "100%", md: "0 0 220px" }}
                />
                <Stat
                    icon={<LuTriangleAlert />}
                    label="Highest Epss"
                    value={<EPSSDisplay epss={stats?.highestCveEpss} triggerProps={{ marginTop: "3px" }} />}
                    flex={{ base: "100%", md: "0 0 220px" }}
                    {...epssColors}
                />
                <Stat
                    icon={<LuTriangleAlert />}
                    label="Highest Severity"
                    value={stats?.highestCveSeverity?.toString()}
                    flex={{ base: "100%", md: "0 0 220px" }}
                    {...severityColors}
                />
            </Flex>

            <SimpleGrid
                columns={{ base: 1, md: 2 }}
                gap={4}
                marginBottom={4}
            >
                <WhiteBox marginBottom={4}>
                    <Heading size="xl" marginBottom={4}>Settings</Heading>

                    <AutoTicketEscalationToggle
                        setting={{
                            effective: enabled,
                            source: "GLOBAL",
                            global: enabled,
                            customerOverride: null
                        }}
                        isCustomerView={false}
                        onChange={onChange}
                        onReset={() => { }}
                        isLoading={false}
                    />
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

            <WhiteBox>
                <Heading size="xl" marginBottom={4}>Timeline</Heading>
                <SoftwareTotalsChart software={software} />
            </WhiteBox>
        </>
    )
}