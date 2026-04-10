import { RunningJobsDrawer } from "@/components/customers/RunningJobsDrawer";
import { CustomerCVEsTab } from "@/components/customers/tabs/CustomerCVEsTab";
import { CustomerDevicesTab } from "@/components/customers/tabs/CustomerDevicesTab";
import { CustomerOverviewTab } from "@/components/customers/tabs/CustomerOverviewTab";
import { CustomerRecommendationsTab } from "@/components/customers/tabs/CustomerRecommendationsTab";
import { CustomerSoftwareTab } from "@/components/customers/tabs/CustomerSoftwareTab";
import { UpdateCustomerDrawer } from "@/components/customers/UpdateCustomerDrawer";
import { toaster } from "@/components/ui/base/Toaster";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { Customer, CustomerStatus } from "@/lib/entities/Customer";
import { ScanStatus, ScanTargetType, ScanType } from "@/lib/entities/ScanJob";
import { useScanJobs } from "@/lib/hooks/useScanJobs";
import { getCustomerById } from "@/lib/repositories/customers";
import { startScanJob } from "@/lib/scan/scanJobHelper";
import { Button, Flex, Heading, Tabs } from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaCircle } from "react-icons/fa";
import { LuPencil, LuRefreshCcw } from "react-icons/lu";

interface Props {
    customer: Customer;
    sidebarCollapsed?: boolean;
}

const TAB_ROUTES = {
    "customer-overview": "",
    "customer-recommendations": "recommendations",
    "customer-software": "software",
    "customer-vulns": "cves",
    "customer-devices": "devices"
}

const ROUTE_TABS = Object.fromEntries(
    Object.entries(TAB_ROUTES).map(([k, v]) => [v, k])
);

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
    const id = params?.id;

    if (!id || Array.isArray(id)) {
        return { notFound: true }
    }

    const customer = await getCustomerById(Number(id));

    if (!customer) {
        return { notFound: true }
    }

    return {
        props: {
            customer: JSON.parse(JSON.stringify(customer))
        }
    }
}

function JobsStatusAndSync({ customer }: any) {
    const [runningJobsDrawerOpen, setRunningJobsDrawerOpen] = useState(false);

    const jobs = useScanJobs();

    const customerJobs = jobs.filter(
        j =>
            (j.targetType === ScanTargetType.CUSTOMER && Number(j.targetId) === customer.id) ||
            j.type === ScanType.ALL_CUSTOMERS
    );

    const runningJobs = customerJobs.filter(
        j => j.status === ScanStatus.RUNNING || j.status === ScanStatus.PENDING
    );

    async function startSync() {
        try {
            const job = await startScanJob({
                type: ScanType.SINGLE_CUSTOMER,
                targetType: ScanTargetType.CUSTOMER,
                targetId: customer.id
            });
            if (job.ok) {
                toaster.create({ type: "success", title: "Sync started" });
            } else {
                toaster.create({ type: "error", title: job.data?.error ?? "Failed to fetch stats" });
            }
        } catch (e) {
            console.error(e);
            toaster.create({ type: "error", title: e.message });
        }
    }


    return (
        <>
            <Button
                size="sm"
                onClick={(e) => setRunningJobsDrawerOpen(true)}
                height={8}
                bgColor="white"
                color="black"
                border="1px solid"
                borderColor="gray.400"
                disabled={runningJobs.length === 0}
                _hover={{
                    bgColor: "blue.100",
                    transform: "scale(1.05)"
                }}
            >
                <FaCircle color={runningJobs.length === 0 ? "orange" : "green"} />
                {runningJobs.length} Running Jobs
            </Button>

            <Button
                size="sm"
                onClick={startSync}
                height={8}
                bgColor="white"
                color="black"
                border="1px solid"
                borderColor="gray.400"
                disabled={runningJobs.length !== 0}
                _hover={{
                    bgColor: "blue.100",
                    transform: "scale(1.05)"
                }}
            >
                <LuRefreshCcw />
                {runningJobs.length === 0 ? "Sync" : "Sync in progress"}
            </Button>

            <RunningJobsDrawer
                open={runningJobsDrawerOpen}
                onCancel={() => setRunningJobsDrawerOpen(false)}
                customer={customer}
                jobs={runningJobs}
            />
        </>
    )
}

export default function CustomerPage({ customer, sidebarCollapsed }: Props) {
    const [updateDrawerOpen, setUpdateDrawerOpen] = useState(false);
    const [stats, setStats] = useState<CustomerStatus>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        setLoadingStats(true);
        try {
            const res = await fetch(`/api/customers/${customer.id}/stats`);
            const data = await res.json();

            if (res.ok) {
                setStats(data);
            } else {
                toaster.create({ type: "error", title: data?.error ?? "Failed to fetch stats" });
            }
        } finally {
            setLoadingStats(false);
        }
    }

    if (sessionStatus === "loading" || loadingStats || !router.isReady) {
        return <SkeletonPage />
    }

    if (!session) {
        router.push("/login");
        return false;
    }

    const tabFromUrl = Array.isArray(router.query.tab) ? router.query.tab[0] : router.query.tab;
    const activeTab = ROUTE_TABS[tabFromUrl ?? ""] ?? "customer-overview";

    return (
        <Page
            title={customer.name}
            sidebarCollapsed={sidebarCollapsed}
        >
            <Flex justifyContent="space-between">
                <Heading size="3xl" marginBottom={4}>{customer.name}</Heading>

                <Flex gap={2}>
                    <JobsStatusAndSync customer={customer} />

                    <Button
                        size="sm"
                        onClick={(e) => setUpdateDrawerOpen(true)}
                        height={8}
                        bgColor="white"
                        color="black"
                        border="1px solid"
                        borderColor="gray.400"
                        _hover={{
                            bgColor: "blue.100",
                            transform: "scale(1.05)"
                        }}
                    >
                        <LuPencil /> Edit Customer
                    </Button>
                </Flex>
            </Flex>

            <Tabs.Root
                lazyMount
                unmountOnExit
                value={activeTab}
                onValueChange={({ value }) => {
                    const route = TAB_ROUTES[value] ?? "";
                    router.replace(
                        `/customers/${customer.id}${route ? `/${route}` : ""}`,
                        undefined,
                        { shallow: true }
                    );
                }}
            >
                <Tabs.List gap={4}>
                    <Tabs.Trigger value="customer-overview">Overview</Tabs.Trigger>
                    <Tabs.Trigger value="customer-recommendations">Recommendations</Tabs.Trigger>
                    <Tabs.Trigger value="customer-software">Software</Tabs.Trigger>
                    <Tabs.Trigger value="customer-vulns">CVEs</Tabs.Trigger>
                    <Tabs.Trigger value="customer-devices">Devices</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="customer-overview">
                    <CustomerOverviewTab customer={customer} stats={stats} />
                </Tabs.Content>
                <Tabs.Content value="customer-recommendations">
                    <CustomerRecommendationsTab customer={customer} />
                </Tabs.Content>
                <Tabs.Content value="customer-software">
                    <CustomerSoftwareTab customer={customer} />
                </Tabs.Content>
                <Tabs.Content value="customer-vulns">
                    <CustomerCVEsTab customerId={customer.id} />
                </Tabs.Content>
                <Tabs.Content value="customer-devices">
                    <CustomerDevicesTab customer={customer} />
                </Tabs.Content>
            </Tabs.Root>

            <UpdateCustomerDrawer
                open={updateDrawerOpen}
                onOpen={setUpdateDrawerOpen}
                customer={customer}
            />
        </Page>
    )
}