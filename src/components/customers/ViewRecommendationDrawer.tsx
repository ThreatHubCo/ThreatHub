import { Customer } from "@/lib/entities/Customer";
import { Recommendation, RecommendationEvent } from "@/lib/entities/SecurityRecommendation";
import {
    Box,
    CloseButton,
    Drawer,
    Field,
    Flex,
    Portal,
    Separator,
    Stack,
    StackSeparator,
    Tabs,
    Text,
    VStack
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuInfo } from "react-icons/lu";
import { Badge } from "../ui/base/Badge";
import { DateTextWithHover } from "../ui/DateTextWithHover";
import { OpenInDefenderButton } from "../ui/OpenInDefenderButton";
import { BooleanCell } from "../cell/BooleanCell";

interface Props {
    open: boolean;
    onOpen: (open: boolean) => void;
    customer: Customer | null;
    recommendation: Recommendation | null;
}

export function ViewRecommendationDrawer({ open, onOpen, customer, recommendation }: Props) {
    const [events, setEvents] = useState<RecommendationEvent[]>([]);

    useEffect(() => {
        if (recommendation && customer) {
            fetchEvents();
        }
    }, [customer, recommendation, open]);

    async function fetchEvents() {
        fetch(`/api/customers/${customer.id}/recommendations/recent-events?recommendationId=${recommendation?.recommendationId}`)
            .then(res => res.json())
            .then(setEvents);
    }

    return (
        <Drawer.Root
            size="md"
            open={open}
            onOpenChange={({ open }) => onOpen(open)}
        >
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.Header>
                            <Box>
                                <Text fontSize={10} color="blue" letterSpacing={1}>SECURITY RECOMMENDATION</Text>
                                <Drawer.Title>{recommendation.recommendationName}</Drawer.Title>
                            </Box>
                        </Drawer.Header>

                        <Drawer.Body paddingBottom={6}>
                            <Tabs.Root defaultValue="recommendation-info" variant="plain" fitted>
                                <Tabs.List gap={1} bg="bg.muted" rounded="l3" p="1">
                                    <Tabs.Trigger height={8} value="recommendation-info">Info</Tabs.Trigger>
                                    <Tabs.Trigger height={8} value="recommendation-events">Events ({events.length})</Tabs.Trigger>
                                    <Tabs.Indicator />
                                </Tabs.List>
                                <Tabs.Content value="recommendation-info" marginTop={2}>
                                    <InfoTab
                                        customer={customer}
                                        recommendation={recommendation}
                                    />
                                </Tabs.Content>
                                <Tabs.Content value="recommendation-events">
                                    <EventsTab
                                        customer={customer}
                                        recommendation={recommendation}
                                        events={events}
                                    />
                                </Tabs.Content>
                            </Tabs.Root>
                        </Drawer.Body>

                        <Drawer.CloseTrigger>
                            <OpenInDefenderButton
                                url="https://security.microsoft.com/security-recommendations"
                                customer={customer}
                                iconOnly
                            />
                            <CloseButton size="sm" />
                        </Drawer.CloseTrigger>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    )
}

interface InfoTabProps {
    recommendation: Recommendation;
    customer: Customer;
}

function InfoTab({ recommendation, customer }: InfoTabProps) {

    function generateDescription() {
        if (recommendation.remediationType === "Update") {
            return `Update ${recommendation.productName} to a later version to mitigate ${recommendation.weaknesses ?? ""} known vulnerabilities.`;
        }
        return "Please view the recommendation in Defender."; // TODO: Description for ConfigurationUpdate etc
    }

    return (
        <Stack gap={8}>
            <Field.Root>
                <Field.Label>Description</Field.Label>
                <Text>{generateDescription()}</Text>
            </Field.Root>

            <Flex gap={2}>
                <Field.Root>
                    <Field.Label>Total CVEs</Field.Label>
                    <Text>{recommendation.weaknesses ?? "-"}</Text>
                </Field.Root>
                <Field.Root>
                    <Field.Label>Exposed Devices</Field.Label>
                    <Text>{recommendation.exposedMachinesCount} / {recommendation.totalMachinesCount}</Text>
                </Field.Root>
                <Field.Root>
                    <Field.Label>Public Exploit</Field.Label>
                    <BooleanCell value={recommendation.publicExploit} />
                </Field.Root>
                <Field.Root>
                    <Field.Label>Active Alert</Field.Label>
                    <BooleanCell value={recommendation.activeAlert} />
                </Field.Root>
            </Flex>

            <Flex gap={2}>
                <Field.Root>
                    <Field.Label>Exposure Impact</Field.Label>
                    <Text>{recommendation.exposureImpact}</Text>
                </Field.Root>
                <Field.Root>
                    <Field.Label>Exposure Impact</Field.Label>
                    <Text>{recommendation.configScoreImpact}</Text>
                </Field.Root>
            </Flex>

            <Flex
                bgColor="blue.100"
                paddingY={2}
                paddingX={4}
                borderRadius="md"
                gap={2}
                alignItems="center"
            >
                <LuInfo style={{ fontSize: "18px" }} /> Please view this recommendation in Defender for the full information.
            </Flex>

            <Separator />

            <Flex gap={1} color="gray.600">
                Last synced <DateTextWithHover date={recommendation.createdAt} reverse />
            </Flex>
        </Stack>
    )
}

const IMPORTANT_TOGGLES = ["public_exploit", "active_alert"];
const COUNT_FIELDS = [
    "total_machines_count",
    "exposed_machines_count",
    "total_critical_devices",
];

function parseNumber(value: any) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function EventsTab({ recommendation, events, customer }) {
    return (
        <VStack
            align="start"
            gap={1}
            marginTop={2}
            separator={<StackSeparator />}
        >
            {events.map((event) => {
                const oldNum = parseNumber(event.old_value);
                const newNum = parseNumber(event.new_value);

                const isImportantToggle =
                    IMPORTANT_TOGGLES.includes(event.field_name) &&
                    event.old_value === false &&
                    event.new_value === true;

                const isCountField = COUNT_FIELDS.includes(event.field_name);

                let trend: "up" | "down" | null = null;

                if (isCountField && oldNum !== null && newNum !== null) {
                    if (newNum > oldNum) trend = "up";
                    if (newNum < oldNum) trend = "down";
                }

                return (
                    <Flex
                        key={event.id}
                        width="100%"
                        justifyContent="space-between"
                        align="center"
                    >
                        <Box>
                            <DateTextWithHover
                                date={event.created_at}
                                withTime
                                reverse
                            />

                            <Flex align="center" gap={2}>
                                <Text fontWeight="medium">
                                    {event.field_name}
                                </Text>

                                {/* 🚨 Critical indicator */}
                                {isImportantToggle && (
                                    <Badge label="IMPORTANT" bgColor="red.200" color="red.700" />
                                )}

                                {/* 📈📉 Trend indicators */}
                                {trend === "up" && (
                                    <Badge label="↑ Increasing" bgColor="orange.200" color="orange.700" />
                                )}

                                {trend === "down" && (
                                    <Badge label="↓ Improving" bgColor="green.200" color="green.700" />
                                )}
                            </Flex>
                            <Flex gap={6}>
                                <Text>
                                    Old: {event.old_value ?? "-"}
                                </Text>
                                <Text>
                                    New: {event.new_value ?? "-"}
                                </Text>
                            </Flex>
                        </Box>
                    </Flex>
                );
            })}
        </VStack>
    );
}