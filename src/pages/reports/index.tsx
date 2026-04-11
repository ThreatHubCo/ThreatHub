import { WhiteBox } from "@/components/ui/box/WhiteBox";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { Session } from "@/lib/entities/Session";
import { Box, Button, Field, Flex, Heading, Input, InputGroup, Link, Stack, Text } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { LuCircleAlert, LuPlus, LuSearch } from "react-icons/lu";

export default function Reports({ sidebarCollapsed }) {
    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState(null);
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
            setFilteredData(data);
        } catch (e) {
            console.error(e);
            setError(e.message || "An unknown error has occurred");
        } finally {
            setLoading(false);
        }
    }

    function handleSearch(term: string) {
        setSearchTerm(term);
        setFilteredData(data.filter(r => {
            const lowerName = r.name.toLowerCase();
            const lowerDesc = r.description?.toLowerCase();
            const lowerTerm = term.toLowerCase();

            return lowerName?.includes(lowerTerm) || lowerDesc?.includes(lowerTerm);
        }));
    }

    if (sessionStatus === "loading" || !router.isReady) {
        return <SkeletonPage />
    }

    if (!session) {
        router.push("/login");
        return false;
    }

    return (
        <Page
            title="Reports"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Flex justifyContent="space-between">
                <Heading size="3xl" marginBottom={4}>Reports</Heading>

                <Flex gap={4}>
                    <Button
                        size="sm"
                        onClick={(e) => router.push("/reports/create")}
                        height={8}
                    >
                        <LuPlus /> Create Report
                    </Button>
                </Flex>
            </Flex>

            <Flex
                bgColor="red.200"
                color="red.700"
                paddingY={2}
                paddingX={4}
                borderRadius="sm"
                marginBottom={4}
                alignItems="center"
                fontSize={{ base: "12px", md: "14px" }}
                gap={2}
            >
                <LuCircleAlert />
                <Text>Please note the reports feature is still in development and some features may be missing or broken. <br />Reports can only be created by an admin.</Text>
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

                <InputGroup
                    maxWidth="400px"
                    startElement={<LuSearch />}
                >
                    <Input
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search by name or description..."
                        bgColor="white"
                    />
                </InputGroup>

            </Flex>

            <Stack gap={2} marginTop={4}>
                {filteredData?.map(report => (
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
                            <Heading size="lg">{report.name}</Heading>
                            <Text fontSize="14px" color="gray.600">{report.description}</Text>

                            <Flex
                                fontSize="12px"
                                color="gray.400"
                                marginTop={1}
                                gap={2}
                            >
                                <Text>Created by {report.created_by_agent_name} on <DateTextWithHover date={report.created_at} as="span" /></Text>
                            </Flex>
                        </WhiteBox>
                    </Link>
                ))}
            </Stack>
        </Page>
    )
}