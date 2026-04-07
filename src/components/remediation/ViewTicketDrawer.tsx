import { useConfig } from "@/lib/config/ConfigContext";
import { RemediationTicket, RemediationTicketStatus } from "@/lib/entities/RemediationTicket";
import {
    Box,
    Button,
    CloseButton,
    DataList,
    Drawer,
    Portal,
    Separator,
    Text
} from "@chakra-ui/react";
import Link from "next/link";
import { LuExternalLink } from "react-icons/lu";
import { Tooltip } from "../ui/base/Tooltip";
import { TicketStatusCell } from "../cell/TicketStatusCell";
import { DataListItem } from "../ui/base/DataListItem";
import { DateTextWithHover } from "../ui/DateTextWithHover";

interface Props {
    open: boolean;
    onOpen: (open: boolean) => void;
    ticket: RemediationTicket | any;
}

export function ViewTicketDrawer({ open, onOpen, ticket }: Props) {
    const config = useConfig();

    return (
        <>
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
                                    <Drawer.Title>Ticket ID - {ticket.external_ticket_id}</Drawer.Title>
                                    <Box width="fit-content" marginTop={1}>
                                        <TicketStatusCell status={ticket.status} />
                                    </Box>

                                    {ticket.status === RemediationTicketStatus.CLOSED_GRACE_PERIOD && (
                                        <Text fontSize="12px" color="gray.500" lineHeight={1.3} marginTop={3}>
                                            This ticket is currently in a grace period. It has been closed in the external ticketing system, but ThreatHub will continue to monitor it for a few days in case it is reopened. If no further activity occurs, it will then be marked as permanently closed.
                                        </Text>
                                    )}
                                </Box>
                            </Drawer.Header>

                            <Drawer.Body paddingBottom={6}>
                                <DataList.Root orientation="horizontal" gap={2} divideY="1px" divideStyle={"margin-top: 10px"}>
                                    <DataListItem label="Last Ticket Update" value={<DateTextWithHover date={ticket.last_ticket_update_at} reverse withTime />} />
                                    <DataListItem pt={1.5} label="Last Sync" value={<DateTextWithHover date={ticket.last_sync_at} reverse withTime />} />
                                    <DataListItem pt={1.5} label="Customer" value={ticket.customer_name} />
                                    <DataListItem pt={1.5} label="Opened By" value={ticket.opened_by_agent_name ?? "System"} />
                                    <DataListItem pt={1.5} label="Software" value={`${ticket.software_name} (Vendor: ${ticket.software_vendor})`} />
                                </DataList.Root>

                                <Text marginTop={8} fontSize="12px" color="gray.500">Database ID: {ticket.id}</Text>
                            </Drawer.Body>

                            <Drawer.CloseTrigger>
                                <Tooltip content="Open Ticket">
                                    <Link href={`${config.TICKET_SYSTEM_URL}/ticket?id=${ticket.external_ticket_id}`}>
                                        <Button
                                            size="sm"
                                            variant="plain"
                                        >
                                            <LuExternalLink />
                                        </Button>
                                    </Link>
                                </Tooltip>

                                <CloseButton size="sm" />
                            </Drawer.CloseTrigger>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>
        </>
    )
}