import { useConfig } from "@/lib/config/ConfigContext";
import { Customer } from "@/lib/entities/Customer";
import { formatTicketStatus, RemediationTicketStatus } from "@/lib/entities/RemediationTicket";
import { Vulnerability } from "@/lib/entities/Vulnerability";
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
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { LuExternalLink, LuMailPlus } from "react-icons/lu";
import { BooleanCell } from "../cell/BooleanCell";
import { SeverityCell } from "../cell/SeverityCell";
import { CreateTicketDrawer } from "../remediation/CreateTicketDrawer";
import { DataListItem } from "../ui/base/DataListItem";
import { toaster } from "../ui/base/Toaster";
import { Tooltip } from "../ui/base/Tooltip";
import { DateTextWithHover } from "../ui/DateTextWithHover";
import { DrawerCVEList } from "../ui/DrawerCVEList";
import { EPSSDisplay } from "../ui/EPSSDisplay";
import { OpenInDefenderButton } from "../ui/OpenInDefenderButton";
import { ViewVulnerabilityDrawer } from "../vulnerabilities/ViewVulnerabilityDrawer";
import { AutoTicketEscalationToggle } from "./AutoTicketEscalationToggle";

interface Props {
    open: boolean;
    onOpen: (open: boolean) => void;
    software: any | null;
    onOpenClientDrawer: (customer: Customer) => void;
}

const CVE_CAP = 50;

export function ViewSoftwareDrawer({ open, onOpen, software, onOpenClientDrawer }: Props) {
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
                        {open ? <DrawerContent open={open} onOpen={onOpen} onOpenClientDrawer={onOpenClientDrawer} software={software} /> : null}
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
}

function DrawerContent({ open, onOpen, software, onOpenClientDrawer }: Props) {
    const [devices, setDevices] = useState<any[]>([]);
    const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
    const [createTicketDrawerOpen, setCreateTicketDrawerOpen] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [customers, setCustomers] = useState([]);

    const [isCapped, setIsCapped] = useState(false);
    const [showAllVulns, setShowAllVulns] = useState(false);

    const config = useConfig();

    useEffect(() => {
        if (!open) {
            setIsCapped(false); 2
            setShowAllVulns(false);
            setVulnerabilities([]);
            setDevices([]);
            setTickets([]);
            setCustomers([]);
        } else {
            setIsCapped(software?.vulnerabilities_count > CVE_CAP && !showAllVulns);
        }
    }, [software, open, showAllVulns]);

    useEffect(() => {
        if (software && open) {
            fetchCustomers();
            fetchVulnerabilities(showAllVulns);
            fetchDevices();
            fetchTickets();
        }
    }, [software, open, showAllVulns]);

    async function fetchCustomers() {
        fetch(`/api/software/${software.id}/drawer/customers`)
            .then(res => res.json())
            .then(setCustomers);
    }

    async function fetchVulnerabilities(loadAll = false) {
        const params = loadAll ? "" : `?limit=${CVE_CAP}`;

        fetch(`/api/software/${software.id}/drawer/cves${params}`)
            .then(res => res.json())
            .then(setVulnerabilities);
    }

    async function fetchDevices() {
        fetch(`/api/software/${software.id}/drawer/devices`)
            .then(res => res.json())
            .then(setDevices);
    }

    async function fetchTickets() {
        fetch(`/api/software/${software.id}/drawer/tickets`)
            .then(res => res.json())
            .then(setTickets);
    }

    const softwareMapItem = findSoftwareInfo(software);

    function enableTicketing() {
        return config.ENABLE_TICKETING && config.TICKET_SYSTEM_URL !== "" && config.TICKET_SYSTEM_URL !== null;
    }

    return (
        <>
            <Drawer.Header>
                <Box flex={1}>
                    <Text fontSize={11} fontWeight={600} color="brand.primaryColor" letterSpacing={1}>SOFTWARE INFO (GLOBAL)</Text>
                    <Drawer.Title>{softwareMapItem.name}</Drawer.Title>
                </Box>

                <Flex>
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

                    <Drawer.CloseTrigger asChild pos="initial">
                        <CloseButton size="sm" />
                    </Drawer.CloseTrigger>
                </Flex>
            </Drawer.Header>

            <Drawer.Body paddingBottom={6}>
                <Tabs.Root defaultValue="software-info" variant="plain">
                    <Tabs.List
                        display="grid"
                        gridTemplateColumns="repeat(3, 1fr)"
                        gap={1}
                        bg="bg.muted"
                        rounded="l3"
                        p="1"
                    >
                        <Tabs.Trigger
                            fontSize="12px"
                            h={8}
                            justifyContent="center"
                            _selected={{
                                bg: "bg.panel",
                                boxShadow: "sm",
                            }}
                            value="software-info"
                        >
                            Info
                        </Tabs.Trigger>

                        <Tabs.Trigger fontSize="12px"
                            h={8}
                            justifyContent="center"
                            _selected={{
                                bg: "bg.panel",
                                boxShadow: "sm",
                            }}
                            value="software-vulns">
                            CVEs ({software.vulnerabilities_count})
                        </Tabs.Trigger>

                        <Tabs.Trigger fontSize="12px"
                            h={8}
                            justifyContent="center"
                            _selected={{
                                bg: "bg.panel",
                                boxShadow: "sm",
                            }}
                            value="software-devices">
                            Devices ({devices.length})
                        </Tabs.Trigger>

                        <Tabs.Trigger fontSize="12px"
                            h={8}
                            justifyContent="center"
                            _selected={{
                                bg: "bg.panel",
                                boxShadow: "sm",
                            }}
                            value="software-tickets">
                            Tickets ({tickets.length})
                        </Tabs.Trigger>

                        <Tabs.Trigger fontSize="12px"
                            h={8}
                            justifyContent="center"
                            _selected={{
                                bg: "bg.panel",
                                boxShadow: "sm",
                            }}
                            value="software-settings">
                            Settings
                        </Tabs.Trigger>

                        <Tabs.Trigger fontSize="12px"
                            h={8}
                            justifyContent="center"
                            _selected={{
                                bg: "bg.panel",
                                boxShadow: "sm",
                            }}
                            value="software-customers">
                            Customers ({customers.length})
                        </Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content value="software-info">
                        <InfoTab software={software} />
                    </Tabs.Content>
                    <Tabs.Content value="software-vulns" marginTop={2}>
                        <VulnerabilitiesTab
                            software={software}
                            vulnerabilities={vulnerabilities}
                            isCapped={isCapped}
                            setShowAllVulns={setShowAllVulns}
                        />
                    </Tabs.Content>
                    <Tabs.Content value="software-devices">
                        <DevicesTab
                            software={software}
                            devices={devices}
                        />
                    </Tabs.Content>
                    <Tabs.Content value="software-tickets">
                        <TicketsTab
                            software={software}
                            tickets={tickets}
                        />
                    </Tabs.Content>
                    <Tabs.Content value="software-customers">
                        <CustomersTab
                            software={software}
                            customers={customers}
                            onOpenClientDrawer={onOpenClientDrawer}
                        />
                    </Tabs.Content>
                    <Tabs.Content value="software-settings">
                        <SettingsTab software={software} />
                    </Tabs.Content>
                </Tabs.Root>
            </Drawer.Body>

            <CreateTicketDrawer
                open={createTicketDrawerOpen}
                onOpen={setCreateTicketDrawerOpen}
                software={software}
            />
        </>
    )
}

function InfoTab({ software }) {
    const softwareMapItem = findSoftwareInfo(software);

    return (
        <>
            <DataList.Root orientation="horizontal" gap={2} divideY="1px">
                <DataListItem pt={1.5} label="Summary" value={softwareMapItem.summary} />
                <DataListItem pt={1.5} label="Vendor" value={softwareMapItem.vendor} />
                <DataListItem pt={1.5} label="Type" value={softwareMapItem.type} />
            </DataList.Root>

            <Stack gap={4} marginTop={10}>
                <Text fontWeight="600" fontSize="18px">Vulnerability Information</Text>

                <DataList.Root orientation="horizontal" gap={2} divideY="1px">
                    <DataListItem pt={1.5} label="Public Exploit" value={<BooleanCell value={software.public_exploit} />} />
                    <DataListItem pt={1.5} label="Verified Exploit" value={<BooleanCell value={software.exploit_verified} />} />
                    <DataListItem pt={1.5} label="Highest EPSS" value={<EPSSDisplay epss={software.highest_cve_epss} />} />
                    <DataListItem pt={1.5} label="Highest CVSS" value={software.highest_cve_cvss_v3} />
                    <DataListItem pt={1.5} label="Highest Severity" value={<SeverityCell severity={software.highest_cve_severity} />} />
                </DataList.Root>
            </Stack >
        </>
    )
}

function VulnerabilitiesTab({ vulnerabilities, software, isCapped, setShowAllVulns }) {
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

            <ViewVulnerabilityDrawer
                open={viewDrawerOpen}
                onOpen={setViewDrawerOpen}
                vulnerability={selectedVuln}
            />
        </>
    )
}

function DevicesTab({ devices, software }) {
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
                        </Flex>
                    </Flex>
                ))}
            </VStack>
        </>
    )
}

function TicketsTab({ tickets, software }) {
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
                    <Table.Row fontSize="13px">
                        <Table.ColumnHeader>ID</Table.ColumnHeader>
                        <Table.ColumnHeader>Status</Table.ColumnHeader>
                        <Table.ColumnHeader>Created</Table.ColumnHeader>
                        <Table.ColumnHeader>Last Update</Table.ColumnHeader>
                        <Table.ColumnHeader>Last Sync</Table.ColumnHeader>
                        <Table.ColumnHeader>Customer</Table.ColumnHeader>
                        <Table.ColumnHeader>Opened By</Table.ColumnHeader>
                        <Table.ColumnHeader></Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {tickets.map(ticket => (
                        <Table.Row key={ticket.id} fontSize="13px">
                            <Table.Cell width="60px">{ticket.external_ticket_id}</Table.Cell>
                            <Table.Cell width="80px">
                                <TicketStatusBadge status={ticket.status} />
                            </Table.Cell>
                            <Table.Cell width="80px">
                                <DateTextWithHover date={ticket.created_at} reverse withTime />
                            </Table.Cell>
                            <Table.Cell width="80px">
                                <DateTextWithHover date={ticket.last_ticket_update_at} reverse withTime />
                            </Table.Cell>
                            <Table.Cell width="80px">
                                <DateTextWithHover date={ticket.last_sync_at} reverse withTime />
                            </Table.Cell>
                            <Table.Cell>
                                {ticket.customer_name}
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

function CustomersTab({ customers, software, onOpenClientDrawer }) {
    const router = useRouter();

    return (
        <>
            <VStack
                align="start"
                gap={4}
                marginTop={2}
                separator={<StackSeparator />}
            >
                {customers.map((customer) => (
                    <Flex key={customer.id} width="100%" justifyContent="space-between">
                        <Box>
                            <Text fontWeight="bold">{customer.name}</Text>
                            {/* <Text fontSize={12} color="gray"><strong>Vulnerable Versions:</strong> {customer.vulnerable_versions}</Text> */}
                        </Box>
                        <Flex>
                            <Tooltip content="Open Software Page for Customer">
                                <Link href={`/software/${software.id}?customer=${customer.id}`}>
                                    <Button
                                        size="sm"
                                        variant="plain"
                                        onClick={(e) => {
                                            router.push(`/software/${software.id}?customer=${customer.id}`);
                                        }}
                                    >
                                        <LuExternalLink />
                                    </Button>
                                </Link>
                            </Tooltip>
                            <OpenInDefenderButton
                                customer={customer}
                                iconOnly
                                url={`https://security.microsoft.com/vulnerability-management-inventories/applications/${software.vendor}-_-${software.name}`}
                            />
                        </Flex>
                        {/* <Button
                            size="xs"
                            onClick={() => onOpenClientDrawer(customer)}
                        >
                            Open Client Specific Info
                        </Button> */}
                    </Flex>
                ))}
            </VStack>
        </>
    )
}

function SettingsTab({ software }) {
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

    return (
        <Stack gap={4}>
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
        </Stack>
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