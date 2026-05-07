import { DataListItem } from "@/components/ui/base/DataListItem";
import { Tooltip } from "@/components/ui/base/Tooltip";
import { DrawerCVEList } from "@/components/ui/DrawerCVEList";
import { DrawerSoftwareList } from "@/components/ui/DrawerSoftwareList";
import { OpenInIntuneButton } from "@/components/ui/OpenInIntuneButton";
import { Customer } from "@/lib/entities/Customer";
import { Device } from "@/lib/entities/Device";
import { Software } from "@/lib/entities/Software";
import { CustomerVulnerabilityWithFullInfo } from "@/lib/entities/Vulnerability";
import {
    Box,
    Button,
    CloseButton,
    DataList,
    Drawer,
    Flex,
    Portal,
    Separator,
    Stack,
    Tabs,
    Text
} from "@chakra-ui/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LuExternalLink } from "react-icons/lu";
import { DateTextWithHover } from "../ui/DateTextWithHover";
import { OpenInDefenderButton } from "../ui/OpenInDefenderButton";
import { BooleanCell } from "../cell/BooleanCell";

interface Props {
    open: boolean;
    onOpen: (open: boolean) => void;
    customer: Customer | any | null;
    device: Device | null;
}

const CVE_CAP = 50;

export function ViewDeviceDrawer({ open, onOpen, customer, device }: Props) {
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
                        {open ? <DrawerContent open={open} onOpen={onOpen} customer={customer} device={device} /> : null}
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
}

function DrawerContent({ open, onOpen, customer, device }: Props) {
    const [vulnerabilities, setVulnerabilities] = useState<CustomerVulnerabilityWithFullInfo[]>([]);
    const [software, setSoftware] = useState<Software[]>([]);

    const [isCapped, setIsCapped] = useState(false);
    const [showAllVulns, setShowAllVulns] = useState(false);

    useEffect(() => {
        if (!open) {
            setIsCapped(false); 2
            setShowAllVulns(false);
            setVulnerabilities([]);
            setSoftware([]);
        } else {
            setIsCapped(device?.total_vulnerabilities > CVE_CAP && !showAllVulns);
        }
    }, [device, open, showAllVulns]);


    useEffect(() => {
        if (device && customer && open) {
            fetchVulnerabilities(showAllVulns);
            fetchSoftware();
        }
    }, [customer, device, open, showAllVulns]);

    async function fetchVulnerabilities(loadAll = false) {
        const params = loadAll ? "" : `?limit=${CVE_CAP}`;

        fetch(`/api/devices/${device.device_id}/drawer/vulnerabilities${params}`)
            .then(res => res.json())
            .then(setVulnerabilities);
    }

    async function fetchSoftware() {
        fetch(`/api/devices/${device.device_id}/drawer/software`)
            .then(res => res.json())
            .then(setSoftware);
    }

    return (
        <>
            <Drawer.Header>
                <Box>
                    <Text fontSize={11} fontWeight={600} color="brand.primaryColor" letterSpacing={1}>DEVICE INFO</Text>
                    <Drawer.Title>{device.dns_name}</Drawer.Title>
                </Box>
            </Drawer.Header>

            <Drawer.Body paddingBottom={6}>
                <Tabs.Root defaultValue="device-info" variant="plain" fitted>
                    <Tabs.List gap={1} bg="bg.muted" rounded="l3" p="1">
                        <Tabs.Trigger height={8} value="device-info">Info</Tabs.Trigger>
                        <Tabs.Trigger height={8} value="device-software">Software ({software.length})</Tabs.Trigger>
                        <Tabs.Trigger height={8} value="device-cves">CVEs ({device.total_vulnerabilities})</Tabs.Trigger>
                        <Tabs.Indicator />
                    </Tabs.List>
                    <Tabs.Content value="device-info" marginTop={2}>
                        <InfoTab
                            customer={customer}
                            device={device}
                        />
                    </Tabs.Content>
                    <Tabs.Content value="device-software">
                        <SoftwareTab
                            customer={customer}
                            device={device}
                            softwares={software}
                        />
                    </Tabs.Content>
                    <Tabs.Content value="device-cves">
                        <VulnerabilitiesTab
                            customer={customer}
                            device={device}
                            vulnerabilities={vulnerabilities}
                            isCapped={isCapped}
                            setShowAllVulns={setShowAllVulns}
                        />
                    </Tabs.Content>
                </Tabs.Root>
            </Drawer.Body>

            <Drawer.CloseTrigger>
                {/* {Boolean(device.is_aad_joined) && (
                                <OpenInIntuneButton
                                    url={`https://intune.microsoft.com/#view/Microsoft_Intune_Devices/DeviceSettingsMenuBlade/~/overview/mdmDeviceId/${device.aad_device_id}`}
                                    customer={customer}
                                    iconOnly
                                />
                            )} */}
                <Tooltip content="Open Device Page">
                    <Link href={`/devices/${device.device_id}`}>
                        <Button
                            size="sm"
                            variant="plain"
                        >
                            <LuExternalLink />
                        </Button>
                    </Link>
                </Tooltip>

                <OpenInDefenderButton
                    url={`https://security.microsoft.com/machines/v2/${device.machine_id}/overview`}
                    customer={customer}
                    iconOnly
                />
                <CloseButton size="sm" />
            </Drawer.CloseTrigger>
        </>
    )
}

interface InfoTabProps {
    device: Device;
    customer: Customer;
}

function InfoTab({ device, customer }: InfoTabProps) {
    return (
        <>
            <Stack gap={8}>
                <DataList.Root orientation="horizontal" gap={2} divideY="1px" divideStyle={"margin-top:10px"}>
                    <DataListItem label="Last Seen" value={<DateTextWithHover date={device.last_seen_at} reverse withTime />} />
                    <DataListItem pt={1.5} label="First Seen" value={<DateTextWithHover date={device.first_seen_at} reverse withTime />} />
                    <DataListItem pt={1.5} label="OS Platform" value={device.os_platform} />
                    <DataListItem pt={1.5} label="OS Version" value={device.os_version} />
                    <DataListItem pt={1.5} label="OS Build" value={device.os_build} />
                    <DataListItem pt={1.5} label="OS Architecture" value={device.os_architecture} />
                    <DataListItem pt={1.5} label="Risk Score" value={device.risk_score} />
                    <DataListItem pt={1.5} label="Managed By" value={device.managed_by} />
                    <DataListItem pt={1.5} label="Customer" value={customer.name} />
                    <DataListItem pt={1.5} label="Entra Joined?" value={<BooleanCell value={device.is_aad_joined} fontSize="12px" lineHeight="1.4" />} />
                    <DataListItem pt={1.5} label="Entra Device ID" value={device.aad_device_id ?? "-"} />
                    <DataListItem pt={1.5} label="Defender ID" value={<Text fontSize="13px">{device.machine_id ?? "-"}</Text>} />
                </DataList.Root>

                {device.is_aad_joined ? (
                    <OpenInIntuneButton
                        url="https://intune.microsoft.com/#view/Microsoft_Intune_Devices/DeviceSettingsMenuBlade/~/overview"
                        customer={customer}
                    />
                ) : false}
            </Stack>

            <Flex gap={1} color="gray.600" lineHeight="1.3" fontSize="12px" marginTop={8}>
                Last synced <DateTextWithHover date={device.last_sync_at} reverse withTime />
            </Flex>
        </>
    )
}

function SoftwareTab({ device, softwares, customer }) {
    if (!softwares?.length) {
        return "No vulnerable software listed";
    }
    return (
        <>
            <DrawerSoftwareList
                items={softwares}
                customer={customer}
            />
        </>
    )
}


function VulnerabilitiesTab({ device, vulnerabilities, customer, isCapped, setShowAllVulns }) {
    if (!vulnerabilities?.length) {
        return "No CVEs listed";
    }
    return (
        <>
            <DrawerCVEList
                vulnerabilities={vulnerabilities}
                totalVulnerabilities={device.total_vulnerabilities}
                capped={isCapped}
                onShowAll={() => setShowAllVulns(true)}
                hideVerifiedExploit
                onClickViewInfo={(vuln) => {
                    // setSelectedVuln(vuln);
                    // setViewDrawerOpen(true);
                }}
            />
        </>
    )
}