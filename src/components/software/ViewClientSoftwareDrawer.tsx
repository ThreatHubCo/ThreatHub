import { useConfig } from "@/lib/config/ConfigContext";
import { Customer } from "@/lib/entities/Customer";
import { formatTicketStatus, RemediationTicketStatus } from "@/lib/entities/RemediationTicket";
import { Severity, Vulnerability } from "@/lib/entities/Vulnerability";
import { findSoftwareInfo } from "@/lib/utils/softwareMap";
import {
    Box,
    Button,
    CloseButton,
    DataList,
    Drawer,
    Flex,
    Portal,
    Stack,
    StackSeparator,
    Table,
    Tabs,
    Text,
    VStack
} from "@chakra-ui/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LuExternalLink, LuEye, LuInfo, LuMailPlus } from "react-icons/lu";
import { CreateTicketDrawer } from "../remediation/CreateTicketDrawer";
import { Badge } from "../ui/base/Badge";
import { DataListItem } from "../ui/base/DataListItem";
import { Tooltip } from "../ui/base/Tooltip";
import { DateTextWithHover } from "../ui/DateTextWithHover";
import { DrawerCVEList } from "../ui/DrawerCVEList";
import { EPSSDisplay } from "../ui/EPSSDisplay";
import { OpenInDefenderButton } from "../ui/OpenInDefenderButton";
import { BooleanCell } from "../cell/BooleanCell";
import { SeverityCell, severityStyles } from "../cell/SeverityCell";
import { ViewClientVulnerabilityDrawer } from "../vulnerabilities/ViewClientVulnerabilityDrawer";

interface Props {
    open: boolean;
    onOpen: (open: boolean) => void;
    customer: Partial<Customer> | null;
    software: any | null;
    onOpenGlobal: () => void;
    hideGlobalButton?: boolean;
}

const CVE_CAP = 50;

export function ViewClientSoftwareDrawer({ open, onOpen, customer, software, onOpenGlobal, hideGlobalButton }: Props) {
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
                        {open ? <DrawerContent open={open} onOpen={onOpen} onOpenGlobal={onOpenGlobal} customer={customer} hideGlobalButton={hideGlobalButton} software={software} /> : null}
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
}

function DrawerContent({ open, onOpen, customer, software, onOpenGlobal, hideGlobalButton }: Props) {
    const [devices, setDevices] = useState<any[]>([]);
    const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
    const [createTicketDrawerOpen, setCreateTicketDrawerOpen] = useState(false);
    const [tickets, setTickets] = useState([]);

    const [isCapped, setIsCapped] = useState(false);
    const [showAllVulns, setShowAllVulns] = useState(false);

    useEffect(() => {
        setIsCapped(software?.vulnerabilities_count > CVE_CAP && !showAllVulns);
    }, [open]);

    const config = useConfig();

    useEffect(() => {
        if (software && customer && open) {
            fetchVulnerabilities(showAllVulns);
            fetchDevices();
            fetchTickets();
        }
    }, [customer, software, open, showAllVulns]);

    async function fetchVulnerabilities(loadAll = false) {
        const params = loadAll ? "" : `?limit=${CVE_CAP}`;

        fetch(`/api/customers/${customer.id}/software/${software.id}${params}`)
            .then(res => res.json())
            .then(setVulnerabilities);
    }

    async function fetchDevices() {
        fetch(`/api/customers/${customer.id}/software/${software.id}/devices`)
            .then(res => res.json())
            .then(setDevices);
    }

    async function fetchTickets() {
        fetch(`/api/customers/${customer.id}/software/${software.id}/tickets`)
            .then(res => res.json())
            .then(setTickets);
    }

    function enableTicketing() {
        return config.ENABLE_TICKETING && config.TICKET_SYSTEM_URL !== "" && config.TICKET_SYSTEM_URL !== null;
    }

    const softwareMapItem = findSoftwareInfo(software);

    return (
        <>
            <Drawer.Header>
                <Box flex={1}>
                    <Flex>
                        <Box flex={1}>
                            <Text fontSize={11} fontWeight={600} color="brand.primaryColor" letterSpacing={1} marginBottom={1}>SOFTWARE INFO</Text>
                            <Drawer.Title lineHeight={1.3}>{softwareMapItem.name}</Drawer.Title>
                        </Box>

                        {!hideGlobalButton && (
                            <Tooltip content="Peek Global Software Info">
                                <Button
                                    size="sm"
                                    variant="plain"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onOpenGlobal();
                                    }}
                                >
                                    <LuEye />
                                </Button>
                            </Tooltip>
                        )}

                        <Tooltip content="Open Software Info Page">
                            <Link href={`/software/${software.id}`}>
                                <Button
                                    size="sm"
                                    variant="plain"
                                >
                                    <LuExternalLink />
                                </Button>
                            </Link>
                        </Tooltip>

                        <OpenInDefenderButton
                            url={`https://security.microsoft.com/vulnerability-management-inventories/applications/${software.vendor}-_-${software.name}`}
                            customer={customer}
                            iconOnly
                        />

                        {enableTicketing() && (
                            <Tooltip content="Create Ticket">
                                <Button
                                    size="sm"
                                    variant="plain"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setCreateTicketDrawerOpen(true);
                                    }}
                                >
                                    <LuMailPlus />
                                </Button>
                            </Tooltip>
                        )}

                        <Drawer.CloseTrigger asChild position="initial">
                            <CloseButton size="sm" />
                        </Drawer.CloseTrigger>
                    </Flex>

                    <Flex
                        marginTop={2}
                        bgColor="brand.100"
                        color="brand.800"
                        paddingY={1}
                        paddingX={4}
                        borderRadius={6}
                        width="fit-content"
                        alignItems="center"
                    >
                        <LuInfo style={{ marginRight: "6px" }} />
                        Viewing customer specific information for <strong style={{ marginLeft: "4px" }}>{customer.name}</strong>
                    </Flex>
                </Box>
            </Drawer.Header>

            <Drawer.Body paddingBottom={6}>
                <Tabs.Root defaultValue="software-info" variant="plain">
                    <Tabs.List gap={1} bg="bg.muted" rounded="l3" p="1">
                        <Tabs.Trigger height={8} value="software-info" paddingX={6}>Info</Tabs.Trigger>
                        <Tabs.Trigger height={8} value="software-vulns">CVEs ({software.vulnerabilities_count})</Tabs.Trigger>
                        <Tabs.Trigger height={8} value="software-devices">Devices ({devices.length})</Tabs.Trigger>
                        <Tabs.Trigger height={8} value="software-tickets">Tickets ({tickets.length})</Tabs.Trigger>
                        <Tabs.Indicator />
                    </Tabs.List>
                    <Tabs.Content value="software-info" marginTop={2}>
                        <InfoTab
                            software={software}
                            customer={customer}
                        />
                    </Tabs.Content>
                    <Tabs.Content value="software-vulns" marginTop={2}>
                        <VulnerabilitiesTab
                            software={software}
                            customer={customer}
                            vulnerabilities={vulnerabilities}
                            isCapped={isCapped}
                            setShowAllVulns={setShowAllVulns}
                        />
                    </Tabs.Content>
                    <Tabs.Content value="software-devices">
                        <DevicesTab
                            software={software}
                            customer={customer}
                            devices={devices}
                        />
                    </Tabs.Content>
                    <Tabs.Content value="software-tickets">
                        <TicketsTab
                            software={software}
                            customer={customer}
                            tickets={tickets}
                        />
                    </Tabs.Content>
                </Tabs.Root>
            </Drawer.Body>

            <CreateTicketDrawer
                open={createTicketDrawerOpen}
                onOpen={setCreateTicketDrawerOpen}
                software={software}
                vulnerabilities={vulnerabilities}
                devices={devices}
                customer={customer}
            />
        </>
    )
}

function InfoTab({ software, customer }) {
    const softwareMapItem = findSoftwareInfo(software);

    const maxVersionsVisible = 5;

    const versionsArray = software.vulnerable_versions ? software.vulnerable_versions.split("|") : [];
    const initialVersions = versionsArray.slice(0, maxVersionsVisible);
    const remainingVersions = versionsArray.slice(maxVersionsVisible);

    return (
        <>
            <Stack gap={8}>
                <DataList.Root orientation="horizontal" gap={2} divideY="1px">
                    <DataListItem pt={1.5} label="Summary" value={softwareMapItem.summary} />
                    <DataListItem pt={1.5} label="Vendor" value={softwareMapItem.vendor} />
                    <DataListItem pt={1.5} label="Type" value={softwareMapItem.type} />
                    <DataListItem pt={1.5} label="Customer" value={customer.name} />
                </DataList.Root>

                {/* <Field.Root>
                    <Field.Label>Vulnerable Versions</Field.Label>
                    <div>
                        <span>{initialVersions.join(", ")}</span>

                        {remainingVersions.length > 0 && (
                            <Collapsible
                                label="Show all versions"
                                summary={`...and ${remainingVersions.length} more`}
                            >
                                <div style={{ marginTop: "0.5rem" }}>
                                    {remainingVersions.join(", ")}
                                </div>
                            </Collapsible>
                        )}
                    </div>
                </Field.Root> */}
            </Stack>

            <Stack gap={4} marginTop={10}>
                <Text fontWeight="600" fontSize="18px">Vulnerability Information</Text>

                <DataList.Root orientation="horizontal" gap={2} divideY="1px">
                    <DataListItem pt={1.5} label="Public Exploit" value={<BooleanCell value={software.public_exploit} />} />
                    <DataListItem pt={1.5} label="Verified Exploit" value={<BooleanCell value={software.exploit_verified} />} />
                    <DataListItem pt={1.5} label="Highest EPSS" value={<EPSSDisplay epss={software.highest_cve_epss} />} />
                    <DataListItem pt={1.5} label="Highest CVSS" value={software.highest_cve_cvss_v3} />
                    <DataListItem pt={1.5} label="Highest Severity" value={<SeverityCell severity={software.highest_cve_severity} />} />
                </DataList.Root>
            </Stack>
        </>
    )
}

function VulnerabilitiesTab({ vulnerabilities, software, customer, isCapped, setShowAllVulns }) {
    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);

    return (
        <>
            <DrawerCVEList
                vulnerabilities={vulnerabilities}
                totalVulnerabilities={software.vulnerabilities_count}
                capped={isCapped}
                onShowAll={() => setShowAllVulns(true)}
                onClickViewInfo={(vuln) => {
                    setSelectedVuln(vuln);
                    setViewDrawerOpen(true);
                }}
            />

            <ViewClientVulnerabilityDrawer
                open={viewDrawerOpen}
                onOpen={setViewDrawerOpen}
                vulnerability={selectedVuln}
                customerId={customer.id}
            />
        </>
    )
}

function DevicesTab({ devices, software, customer }) {
    return (
        <>
            <VStack
                align="start"
                gap={1}
                marginTop={2}
                separator={<StackSeparator />}
            >
                {devices.map((device) => (
                    <Flex key={device.id} width="100%" justifyContent="space-between">
                        <Box>
                            <Text>{device.dns_name}</Text>
                            <Text fontSize={10} color="gray">{device.machine_id}</Text>
                        </Box>
                        <Flex gap={1}>
                            <Text fontSize={12}>{device.os_platform}</Text>
                            <Text fontSize={12} color="gray">/</Text>
                            <Text fontSize={12}>{device.os_version}</Text>

                            <OpenInDefenderButton
                                url={`https://security.microsoft.com/machines/v2/${device.machine_id}/overview`}
                                customer={customer}
                                iconOnly
                            />
                        </Flex>
                    </Flex>
                ))}
            </VStack>
        </>
    )
}

const ticketStatusStyles: Record<RemediationTicketStatus, { bg: string; color: string }> = {
    [RemediationTicketStatus.OPEN]: { bg: "green.200", color: "green.700" },
    [RemediationTicketStatus.CLOSED_GRACE_PERIOD]: { bg: "orange.200", color: "orange.700" },
    [RemediationTicketStatus.CLOSED]: { bg: "red.200", color: "red.700" },
    [RemediationTicketStatus.UNKNOWN]: { bg: "gray.200", color: "gray.700" }
}

function TicketStatusBadge({ status }) {
    const style = ticketStatusStyles[status as RemediationTicketStatus] || ticketStatusStyles.UNKNOWN;
    return (
        <Box
            bgColor={style.bg}
            color={style.color}
            fontSize="11px"
            paddingY={1}
            paddingX={2}
            borderRadius={6}
            width="fit-content"
            lineHeight="1.2"
        >
            {formatTicketStatus(status)}
        </Box>
    )
}

function TicketsTab({ tickets, software, customer }) {
    const config = useConfig();

    return (
        <>
            <Text
                fontSize={12}
                color="gray.500"
                lineHeight="1.2"
                marginBottom={2}
            >
                Tickets with status "Grace Period" were determined to be CLOSED during the last sync. They will be marked permanently closed if they are not re-opened in the next few days.
            </Text>

            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>ID</Table.ColumnHeader>
                        <Table.ColumnHeader>Status</Table.ColumnHeader>
                        <Table.ColumnHeader>Created</Table.ColumnHeader>
                        <Table.ColumnHeader>Last Update</Table.ColumnHeader>
                        <Table.ColumnHeader>Last Sync</Table.ColumnHeader>
                        <Table.ColumnHeader>Opened By</Table.ColumnHeader>
                        <Table.ColumnHeader></Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body fontSize="12px">
                    {tickets.map(ticket => (
                        <Table.Row key={ticket.id}>
                            <Table.Cell width="70px">{ticket.external_ticket_id}</Table.Cell>
                            <Table.Cell width="80px">
                                <TicketStatusBadge status={ticket.status} />
                            </Table.Cell>
                            <Table.Cell width="100px">
                                <DateTextWithHover date={ticket.created_at} reverse withTime />
                            </Table.Cell>
                            <Table.Cell width="100px">
                                <DateTextWithHover date={ticket.last_ticket_update_at} reverse withTime />
                            </Table.Cell>
                            <Table.Cell width="100px">
                                <DateTextWithHover date={ticket.last_sync_at} reverse withTime />
                            </Table.Cell>
                            <Table.Cell>{ticket.opened_by_agent_name ?? "System"}</Table.Cell>
                            <Table.Cell>
                                {(config.ENABLE_TICKETING && config.TICKET_SYSTEM_URL) ? (
                                    <Tooltip content="Open Ticket">
                                        <Button
                                            size="xs"
                                            variant="plain"
                                            height={4}
                                            minWidth={6}
                                            paddingX={1}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <a
                                                href={`${config.TICKET_SYSTEM_URL}/ticket?id=${ticket.external_ticket_id}`}
                                                target="_blank"
                                            >
                                                <LuExternalLink />
                                            </a>
                                        </Button>
                                    </Tooltip>
                                ) : false}
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </>
    )
}

function SeverityBadge({ severity }) {
    const style = severityStyles[severity as Severity] || severityStyles.Unknown;
    return <Badge label={severity} bgColor={style.bg} color={style.color} />
}
