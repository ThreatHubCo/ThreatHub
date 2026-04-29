import { DataListItem } from "@/components/ui/base/DataListItem";
import { Stat } from "@/components/ui/base/Stat";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { Session } from "@/lib/entities/Session";
import { Box, DataList, Flex, Heading } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { LuCheck, LuCircleX, LuInfo } from "react-icons/lu";

export default function AdminServerStats({ sidebarCollapsed }: { sidebarCollapsed: boolean }) {
    const [data, setData] = useState(null);
    const [tables, setTables] = useState([]);
    const [error, setError] = useState("");

    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    useEffect(() => {
        const id = setInterval(() => {
            if (sessionStatus === "authenticated") {
                fetchStats();
            }
        }, 1000);
        return () => clearInterval(id);
    }, [sessionStatus]);

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchTables();
        }
        const id = setInterval(() => {
            if (sessionStatus === "authenticated") {
                fetchTables();
            }
        }, 10 * 1000);
        return () => clearInterval(id);
    }, [sessionStatus]);

    async function fetchStats() {
        try {
            const response = await fetch("/api/admin/stats");

            if (!response.ok) {
                throw new Error("Failed to fetch server stats");
            }

            const data = await response.json();
            setData(data);
        } catch (e) {
            console.error(e);
            setError(e.message || "Unknown error occurred");
        }
    }

    async function fetchTables() {
        try {
            const response = await fetch("/api/admin/tables");

            if (!response.ok) {
                throw new Error("Failed to fetch database tables");
            }

            const data = await response.json();
            setTables(data?.tables);
        } catch (e) {
            console.error(e);
            setError(e.message || "Unknown error occurred");
        }
    }

    if (sessionStatus === "loading" || !router.isReady) {
        return <SkeletonPage />
    }

    if (!session) {
        router.push("/login");
        return false;
    }

    if (error) {
        return <ErrorPage error={error} />
    }

    const lastCheckIn = data?.ingestorLastCheckIn
    const isRecent = lastCheckIn && Date.now() - new Date(lastCheckIn).getTime() <= 60_000

    return (
        <Page
            title="Server Stats"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Heading size="3xl" marginBottom={4}>Server Stats</Heading>

            <Flex gap={2} marginBottom={4} flexWrap="wrap">
                <Stat
                    icon={<LuInfo />}
                    label="CPU Usage"
                    value={data?.cpuUsage ?? "-"}
                    bgColor="blue.100"
                    color="blue.700"
                    flex={{ base: "100%", md: "0 0 240px" }}
                />
                <Stat
                    icon={<LuInfo />}
                    label="Memory Usage"
                    value={data?.memoryUsage ?? "-"}
                    bgColor="blue.100"
                    color="blue.700"
                    flex={{ base: "100%", md: "0 0 240px" }}
                />
                <Stat
                    icon={<LuInfo />}
                    label="Disk Usage"
                    value={data?.diskUsage ?? "-"}
                    bgColor="blue.100"
                    color="blue.700"
                    flex={{ base: "100%", md: "0 0 240px" }}
                />
                <Stat
                    icon={<LuInfo />}
                    label="Database Size"
                    value={data?.databaseSize ?? "-"}
                    bgColor="blue.100"
                    color="blue.700"
                    flex={{ base: "100%", md: "0 0 240px" }}
                />
            </Flex>

            <Stat
                icon={isRecent ? <LuCheck /> : <LuCircleX />}
                label="Ingestor Last Check In"
                value={(
                    <Box color={isRecent ? "green.500" : "red.500"} fontSize="18px" >
                        <DateTextWithHover date={data?.ingestorLastCheckIn} reverse withTime showSeconds />
                    </Box>
                )}
                bgColor={isRecent ? "green.100" : "red.100"}
                color={isRecent ? "green.700" : "red.500"}
                width="240px"
            />

            <Box
                bgColor="white"
                paddingY={4}
                paddingX={8}
                marginTop={4}
                borderRadius={8}
                width="fit-content"
            >
                <Heading size="lg" marginBottom={4}>Database Tables</Heading>

                <DataList.Root orientation="horizontal" gap={0}>
                    {tables.map(table => (
                        <DataListItem key={table.name} label={table.name} value={table.rows} />
                    ))}
                </DataList.Root>
            </Box>

            <Box marginTop={10} color="gray.500" fontSize="14px">
                ThreatHub v{process.env.NEXT_PUBLIC_VERSION ?? "unknown"} ({process.env.NEXT_PUBLIC_GIT_COMMIT ?? "unknown"}) 
            </Box>
        </Page>
    );
}
