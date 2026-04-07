import { Stat } from "@/components/ui/base/Stat";
import { toaster } from "@/components/ui/base/Toaster";
import { EPSSDisplay } from "@/components/ui/EPSSDisplay";
import { Customer } from "@/lib/entities/Customer";
import { Software } from "@/lib/entities/Software";
import { getRiskColors } from "@/lib/utils/statColorUtils";
import { Box, Flex, Heading } from "@chakra-ui/react";
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

    return (
        <>
            <Flex gap={4} flexWrap="wrap" marginBottom={4}>
                <Stat
                    icon={<LuTriangleAlert />}
                    label="Critical CVEs"
                    value={stats?.totalCriticalCves?.toString()}
                    bgColor="red.100"
                    color="red.700"
                />
                <Stat
                    icon={<LuTriangleAlert />}
                    label="High CVEs"
                    value={stats?.totalHighCves?.toString()}
                    bgColor="red.100"
                    color="red.700"
                />
                <Stat
                    icon={<LuTriangleAlert />}
                    label="Public Exploit"
                    value={stats?.totalPublicExploit?.toString()}
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
                    value={stats?.highestCveSeverity?.toString()}
                    {...severityColors}
                />
            </Flex>

            <Box
                bgColor="white"
                borderRadius={8}
                paddingY={4}
                paddingX={6}
                marginBottom={4}
            >
                <Heading size="xl" marginBottom={4}>Timeline</Heading>

                <SoftwareTotalsChart software={software} />
            </Box>

            <Box
                bgColor="white"
                borderRadius={8}
                paddingY={4}
                paddingX={6}
                marginBottom={4}
            >
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
            </Box>
        </>
    )
}