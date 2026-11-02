import { WhiteBox } from "@/components/ui/box/WhiteBox";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { AgentPermission, hasPermission } from "@/lib/agents/permissions";
import { requireAuth } from "@/lib/utils/requireAuthPage";
import { Button, Flex, Heading, Input, InputGroup, Link, Select, Stack, Tabs, Text, createListCollection } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { LuCircleAlert, LuPlus, LuSearch } from "react-icons/lu";

export const getServerSideProps = requireAuth(async (ctx) => {
    return { props: {} }
});

const TAB_ROUTES = {
    "report-list": "/reports",
    "report-categories": "/reports/categories"
};

export default function Reports({ session, sidebarCollapsed }) {
    const router = useRouter();

    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/reports");

            if (!response.ok) {
                throw new Error("Failed to fetch reports");
            }

            const data = await response.json();

            setData(data);
        } catch (e) {
            console.error(e);
            setError(e.message || "An unknown error has occurred");
        } finally {
            setLoading(false);
        }
    }

    const categories = useMemo(() => {
        const uniqueCategories = new Map();

        data.forEach(report => {
            if (report.category_id) {
                uniqueCategories.set(report.category_id, {
                    id: report.category_id,
                    name: report.category_name
                });
            }
        });

        return Array.from(uniqueCategories.values())
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [data]);

    const categoryCollection = createListCollection({
        items: [
            { label: "All categories", value: "all" },
            ...categories.map(category => ({
                label: category.name,
                value: String(category.id)
            }))
        ]
    });

    const filteredData = useMemo(() => {
        const term = searchTerm.toLowerCase();

        return data.filter(report => {
            const matchesSearch =
                report.name?.toLowerCase().includes(term) ||
                report.description?.toLowerCase().includes(term) ||
                report.category_name?.toLowerCase().includes(term);

            const matchesCategory =
                selectedCategory === "all" ||
                String(report.category_id) === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [data, searchTerm, selectedCategory]);

    if (!router.isReady) {
        return <SkeletonPage />;
    }

    if (!session) {
        router.push("/login");
        return false;
    }

    const activeTab = router.pathname === "/reports/categories" ? "report-categories" : "report-list";

    return (
        <Page
            title="Reports"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Tabs.Root
                value={activeTab}
                onValueChange={({ value }) => {
                    router.push(TAB_ROUTES[value]);
                }}
            >
                <Tabs.List marginBottom={4}>
                    <Tabs.Trigger value="report-list">
                        Reports
                    </Tabs.Trigger>

                    <Tabs.Trigger value="report-categories">
                        Categories
                    </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="report-list">
                    <Flex justifyContent="space-between" alignItems="center">
                        <Heading size="3xl" marginBottom={4}>
                            Reports
                        </Heading>

                        {hasPermission(session, AgentPermission.REPORT_CREATE) && (
                            <Button
                                size="sm"
                                onClick={() => router.push("/reports/create")}
                                height={8}
                            >
                                <LuPlus /> Create Report
                            </Button>
                        )}
                    </Flex>

                    <Flex
                        align="center"
                        columnGap={4}
                        rowGap={2}
                        flexDirection={{ base: "column", md: "row" }}
                    >
                        <Text marginRight="auto" whiteSpace="nowrap" color="gray.600">
                            Showing {filteredData.length} of {data.length} reports
                        </Text>

                        <Select.Root
                            collection={categoryCollection}
                            value={[selectedCategory]}
                            onValueChange={({ value }) => setSelectedCategory(value[0] || "all")}
                            width={{ base: "100%", md: "220px" }}
                            size="sm"
                        >
                            <Select.HiddenSelect />
                            <Select.Control>
                                <Select.Trigger bgColor="white">
                                    <Select.ValueText placeholder="Filter by category" />
                                </Select.Trigger>
                                <Select.IndicatorGroup>
                                    <Select.Indicator />
                                </Select.IndicatorGroup>
                            </Select.Control>
                            <Select.Positioner>
                                <Select.Content>
                                    {categoryCollection.items.map(category => (
                                        <Select.Item
                                            key={category.value}
                                            item={category}
                                        >
                                            {category.label}
                                            <Select.ItemIndicator />
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Positioner>
                        </Select.Root>

                        <InputGroup
                            maxWidth={{ base: "100%", md: "400px" }}
                            startElement={<LuSearch />}
                        >
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search reports..."
                                bgColor="white"
                            />
                        </InputGroup>
                    </Flex>

                    {error && (
                        <Text color="red.500" marginTop={4}>
                            {error}
                        </Text>
                    )}

                    <Stack gap={2} marginTop={4}>
                        {!loading && filteredData.length === 0 && (
                            <Text color="gray.500">
                                No reports found.
                            </Text>
                        )}

                        {filteredData.map(report => (
                            <Link
                                key={report.id}
                                href={`/reports/${report.id}`}
                                display="block"
                            >
                                <WhiteBox
                                    borderColor="gray.300"
                                    _hover={{
                                        transform: "scale(1.01)",
                                        bgColor: "blue.50"
                                    }}
                                    transition="transform 200ms ease-in-out"
                                >
                                    <Flex
                                        justifyContent="space-between"
                                        alignItems="center"
                                        gap={2}
                                    >
                                        <Heading size="lg">
                                            {report.name}
                                        </Heading>

                                        {report.category_name && (
                                            <Text
                                                fontSize="xs"
                                                bgColor="blue.50"
                                                color="blue.700"
                                                paddingX={2}
                                                paddingY={1}
                                                borderRadius="md"
                                                whiteSpace="nowrap"
                                            >
                                                {report.category_name}
                                            </Text>
                                        )}
                                    </Flex>

                                    {report.description && (
                                        <Text fontSize="14px" color="gray.600">
                                            {report.description}
                                        </Text>
                                    )}

                                    <Flex
                                        fontSize="12px"
                                        color="gray.400"
                                        marginTop={1}
                                        gap={2}
                                    >
                                        <Text>
                                            Created by {report.created_by_agent_name || "Unknown"} on{" "}
                                            <DateTextWithHover
                                                date={report.created_at}
                                                as="span"
                                            />
                                        </Text>
                                    </Flex>
                                </WhiteBox>
                            </Link>
                        ))}
                    </Stack>
                </Tabs.Content>
            </Tabs.Root>
        </Page>
    );
}