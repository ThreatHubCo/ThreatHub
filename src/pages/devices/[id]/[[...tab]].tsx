import { DeviceCVEsTab } from "@/components/devices/tabs/DeviceCVEsTab";
import { DeviceOverviewTab } from "@/components/devices/tabs/DeviceOverviewTab";
import { DeviceSoftwareTab } from "@/components/devices/tabs/DeviceSoftwareTab";
import { toaster } from "@/components/ui/base/Toaster";
import { OpenInIntuneButton } from "@/components/ui/OpenInIntuneButton";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { DeviceInfoStats } from "@/lib/entities/Device";
import { getDeviceById } from "@/lib/repositories/devices";
import { Box, Flex, Heading, Tabs, Text } from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface Props {
    device: any;
    sidebarCollapsed?: boolean;
}

const TAB_ROUTES = {
    "device-overview": "",
    "device-cves": "cves",
    "device-software": "software"
}

const ROUTE_TABS = Object.fromEntries(
    Object.entries(TAB_ROUTES).map(([k, v]) => [v, k])
);

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
    const id = params?.id;

    if (!id || Array.isArray(id)) {
        return { notFound: true }
    }

    const device = await getDeviceById(Number(id));

    if (!device) {
        return { notFound: true }
    }

    return {
        props: {
            device: JSON.parse(JSON.stringify(device))
        }
    }
}

export default function DeviceInfoPage({ device, sidebarCollapsed }: Props) {
    const [stats, setStats] = useState<DeviceInfoStats>(null);

    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        try {
            const res = await fetch(`/api/devices/${device.id}/stats`);
            const data = await res.json();

            if (res.ok) {
                setStats(data);
            } else {
                toaster.create({ type: "error", title: data?.error ?? "Failed to fetch stats" });
            }
        } catch (e) {
            toaster.create({ type: "error", title: e.message });
        }
    }

    if (sessionStatus === "loading" || !router.isReady) {
        return <SkeletonPage />
    }

    if (!session) {
        router.push("/login");
        return false;
    }

    const tabFromUrl = Array.isArray(router.query.tab) ? router.query.tab[0] : router.query.tab;
    const activeTab = ROUTE_TABS[tabFromUrl ?? ""] ?? "device-overview";

    return (
        <Page
            title={device.dns_name}
            sidebarCollapsed={sidebarCollapsed}
        >
            <Flex justifyContent="space-between">
                <Box marginBottom={4}>
                    <Text fontSize={10} color="blue" letterSpacing={1} marginBottom={1}>DEVICE INFORMATION</Text>
                    <Heading size="3xl" marginBottom={0}>{device.dns_name}</Heading>
                </Box>

                {device.is_aad_joined ? (
                    <OpenInIntuneButton
                        url="https://intune.microsoft.com/#view/Microsoft_Intune_Devices/DeviceSettingsMenuBlade/~/overview"
                        customer={{
                            name: device.customer_name,
                            supports_csp: device.customer_supports_csp,
                            tenant_id: device.customer_tenant_id
                        }}
                    />
                ) : false}
            </Flex>

            <Tabs.Root
                lazyMount
                unmountOnExit
                value={activeTab}
                onValueChange={({ value }) => {
                    const route = TAB_ROUTES[value] ?? "";
                    router.replace(
                        `/devices/${device.id}${route ? `/${route}` : ""}`,
                        undefined,
                        { shallow: true }
                    );
                }}
            >
                <Tabs.List gap={4}>
                    <Tabs.Trigger value="device-overview">Overview</Tabs.Trigger>
                    <Tabs.Trigger value="device-cves">CVEs ({stats?.totalCves ?? "0"})</Tabs.Trigger>
                    <Tabs.Trigger value="device-software">Software ({stats?.totalSoftware ?? "0"})</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="device-overview">
                    <DeviceOverviewTab device={device} stats={stats} />
                </Tabs.Content>
                <Tabs.Content value="device-cves">
                    <DeviceCVEsTab device={device} />
                </Tabs.Content>
                <Tabs.Content value="device-software">
                    <DeviceSoftwareTab device={device} />
                </Tabs.Content>
            </Tabs.Root>
        </Page>
    )
}