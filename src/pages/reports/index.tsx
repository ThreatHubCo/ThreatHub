import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { Session } from "@/lib/entities/Session";
import { Box, Button, Field, Flex, Heading, Input, Link, Stack, Text } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { LuCircleAlert, LuPlus } from "react-icons/lu";

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
                gap={2}
            >
                <LuCircleAlert />
                <Text>Please note the reports feature is still in development and some features may be missing or broken. <br />Reports can only be created by an admin.</Text>
            </Flex>

            <Box
                marginBottom={4}
                bgColor="white"
                padding={4}
                borderRadius={8}
                width="400px"
            >
                <Field.Root>
                    <Field.Label>Search</Field.Label>
                    <Input
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    <Field.HelperText>Search by name and description</Field.HelperText>
                </Field.Root>
            </Box>

            <Text>Showing {filteredData.length} / {data.length} reports</Text>

            <Stack gap={2} marginTop={4}>
                {filteredData?.map(report => (
                    <Link
                        key={report.id}
                        href={`/reports/${report.id}`}
                        display="block"
                    >
                        <Box
                            bgColor="white"
                            paddingY={4}
                            paddingX={6}
                            borderRadius={8}
                            border="1px solid"
                            borderColor="gray.400"
                            _hover={{
                                transform: "scale(1.01)",
                                bgColor: "blue.50"
                            }}
                            transition="transform 200ms ease-in-out"
                        >
                            <Heading size="lg">{report.name}</Heading>
                            <Text fontSize="14px" color="gray.500">{report.description}</Text>
                        </Box>
                    </Link>
                ))}
            </Stack>
        </Page>
    )
}