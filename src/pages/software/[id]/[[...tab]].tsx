import { SoftwareCustomersTab } from "@/components/software/tabs/SoftwareCustomersTab";
import { SoftwareCVEsTab } from "@/components/software/tabs/SoftwareCVEsTab";
import { SoftwareDevicesTab } from "@/components/software/tabs/SoftwareDevicesTab";
import { SoftwareOverviewTab } from "@/components/software/tabs/SoftwareOverviewTab";
import { SoftwareTicketsTab } from "@/components/software/tabs/SoftwareTicketsTab";
import { toaster } from "@/components/ui/base/Toaster";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { Customer } from "@/lib/entities/Customer";
import { Software, SoftwareInfoStats } from "@/lib/entities/Software";
import { getSoftwareById } from "@/lib/repositories/software";
import { Box, Flex, Heading, NativeSelect, Tabs, Text } from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { LuInfo } from "react-icons/lu";

interface Props {
    software: Software;
    sidebarCollapsed?: boolean;
}

const TAB_ROUTES = {
    "software-overview": "",
    "software-cves": "cves",
    "software-devices": "devices",
    "software-tickets": "tickets",
    "software-customers": "customers"
}

const ROUTE_TABS = Object.fromEntries(
    Object.entries(TAB_ROUTES).map(([k, v]) => [v, k])
);

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
    const id = params?.id;

    if (!id || Array.isArray(id)) {
        return { notFound: true }
    }

    const software = await getSoftwareById(Number(id));

    if (!software) {
        return { notFound: true }
    }

    return {
        props: {
            software: JSON.parse(JSON.stringify(software))
        }
    }
}

export default function SoftwareInfoPage({ software, sidebarCollapsed }: Props) {
    const [stats, setStats] = useState<SoftwareInfoStats>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);

    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();

    const customerIdFromQuery = router.query.customer as string;
    const activeCustomer = customers.find(c => c.id.toString() === customerIdFromQuery);

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (router.isReady) {
            fetchStats();
        }
    }, [router.query.customer]);

    async function fetchStats() {
        try {
            let url = `/api/software/${software.id}/stats`;

            if (customerIdFromQuery) {
                url += `?customer=${customerIdFromQuery}`;
            }

            const res = await fetch(url);
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

    async function fetchCustomers() {
        try {
            const res = await fetch(`/api/customers`);
            const data = await res.json();

            if (res.ok) {
                setCustomers(data.customers);
            } else {
                toaster.create({ type: "error", title: data?.error ?? "Failed to fetch customers" });
            }
        } catch (e) {
            toaster.create({ type: "error", title: e.message });
        }
    }

    function handleCustomerChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const val = e.target.value;

        const newQuery = { ...router.query }

        if (val) {
            newQuery.customer = val;
        } else {
            delete newQuery.customer;
        }

        router.replace({
            pathname: router.pathname,
            query: newQuery
        }, undefined, { shallow: true });
    }

    if (sessionStatus === "loading" || !router.isReady) {
        return <SkeletonPage />
    }

    if (!session) {
        router.push("/login");
        return false;
    }

    const tabFromUrl = Array.isArray(router.query.tab) ? router.query.tab[0] : router.query.tab;
    const activeTab = ROUTE_TABS[tabFromUrl ?? ""] ?? "software-overview";

    return (
        <Page
            title={software.name}
            sidebarCollapsed={sidebarCollapsed}
        >
            <Flex justifyContent="space-between">
                <Box marginBottom={4}>
                    <Heading size="3xl" marginBottom={2}>{software.name}</Heading>
                    <Text>{software.summary}</Text>

                    {activeCustomer && (
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
                            Viewing customer specific information for <strong style={{ marginLeft: "4px" }}>{activeCustomer.name}</strong>
                        </Flex>
                    )}
                </Box>

                <Flex gap={4}>
                    <Text lineHeight="1.9">Customer</Text>
                    <NativeSelect.Root>
                        <NativeSelect.Field
                            width="250px"
                            height={8}
                            bgColor="white"
                            color="black"
                            border="1px solid"
                            borderColor="gray.400"
                            _hover={{
                                bgColor: "blue.50",
                                transform: "scale(1.05)"
                            }}
                            value={customerIdFromQuery ?? ""}
                            onChange={handleCustomerChange}
                        >
                            <option value="">All Customers</option>

                            {customers.filter(c => !c.deleted_at).map(customer => (
                                <option key={customer.id} value={customer.id}>{customer.name}</option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                </Flex>
            </Flex>

            <Tabs.Root
                lazyMount
                unmountOnExit
                value={activeTab}
                onValueChange={({ value }) => {
                    const tabRoute = TAB_ROUTES[value] ?? "";
                    const currentQuery = { ...router.query };

                    delete currentQuery.tab;
                    delete currentQuery.id; 

                    router.replace({
                        pathname: `/software/${software.id}${tabRoute ? `/${tabRoute}` : ""}`,
                        query: currentQuery,
                    }, undefined, { shallow: true });
                }}
            >
                <Tabs.List gap={4}>
                    <Tabs.Trigger value="software-overview">Overview</Tabs.Trigger>
                    <Tabs.Trigger value="software-cves">CVEs ({stats?.totalCves ?? "0"})</Tabs.Trigger>
                    <Tabs.Trigger value="software-devices">Devices ({stats?.totalDevices ?? "0"})</Tabs.Trigger>
                    <Tabs.Trigger value="software-tickets">Tickets ({stats?.totalTickets ?? "0"})</Tabs.Trigger>
                    <Tabs.Trigger value="software-customers">Customers ({stats?.totalCustomers ?? "0"})</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="software-overview">
                    <SoftwareOverviewTab software={software} stats={stats} customer={activeCustomer} />
                </Tabs.Content>
                <Tabs.Content value="software-cves">
                    <SoftwareCVEsTab software={software} customer={activeCustomer} />
                </Tabs.Content>
                <Tabs.Content value="software-devices">
                    <SoftwareDevicesTab software={software} customer={activeCustomer} />
                </Tabs.Content>
                <Tabs.Content value="software-tickets">
                    <SoftwareTicketsTab software={software} customer={activeCustomer} />
                </Tabs.Content>
                <Tabs.Content value="software-customers">
                    <SoftwareCustomersTab software={software} />
                </Tabs.Content>
            </Tabs.Root>
        </Page>
    )
}