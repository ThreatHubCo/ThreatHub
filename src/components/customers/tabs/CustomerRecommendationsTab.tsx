import { BooleanCell } from "@/components/cell/BooleanCell";
import { Column, DataTable } from "@/components/ui/base/DataTable";
import { Stat } from "@/components/ui/base/Stat";
import { TableState } from "@/components/ui/base/TableStateWrapper";
import { toaster } from "@/components/ui/base/Toaster";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { OpenInDefenderButton } from "@/components/ui/OpenInDefenderButton";
import { Customer } from "@/lib/entities/Customer";
import { Recommendation } from "@/lib/entities/SecurityRecommendation";
import { Session } from "@/lib/entities/Session";
import { useTableMeta } from "@/lib/hooks/useTableMeta";
import { useTableQuery } from "@/lib/hooks/useTableQuery";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { Button, Flex, Text } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { LuCircleAlert, LuFolderSync, LuTriangleAlert } from "react-icons/lu";
import { ViewRecommendationDrawer } from "../ViewRecommendationDrawer";

interface Props {
    customer: Customer;
}

const defaultColumns = [
    "recommendationName",
    "productName",
    "vendor",
    "exposureImpact",
    "publicExploit",
    "exposedMachinesCount",
    "totalMachineCount",
    "exposedCriticalDevices",
    "actions"
]

export function CustomerRecommendationsTab({ customer }: Props) {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [stats, setStats] = useState(null);
    const [recLastSync, setRecLastSync] = useState(null);
    const [state, setState] = useState<TableState>(TableState.LOADING);

    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [selectedRecommendation, setSelectedRecommendation] = useState<any | null>(null);

    const { data: session, status: sessionStatus } = useSession() as Session;

    const tableQuery = useTableQuery<Recommendation>(20);
    const { tableMeta, setTableMeta } = useTableMeta();

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchRecommendations();
        }
    }, [sessionStatus, tableQuery.state.page, tableQuery.state.sort, tableQuery.state.filters]);

    async function fetchRecommendations() {
        try {
            setState(TableState.LOADING);

            const params = buildTableParams(tableQuery);
            const res = await fetch(`/api/customers/${customer.id}/recommendations?${params}`);
            const data = await res.json();

            if (!res.ok) {
                setState(TableState.FAILED);
                return;
            }

            setRecommendations(data.rows);
            setRecLastSync(data.rows[0]?.createdAt);
            setStats(data.stats);
            setTableMeta(data.meta);
            setState(TableState.LOADED);
        } catch (e) {
            console.error(e);
            setState(TableState.FAILED);
        }
    }

    function handleViewRecommendation(recommendation: any) {
        setSelectedRecommendation(recommendation);
        setViewDrawerOpen(true);
    }

    const columns: Column<Recommendation>[] = useMemo(() => [
        { key: "recommendationId", label: "Internal ID", width: "80px" },
        { key: "defenderRecommendationId", label: "Defender ID", width: "60px" },
        { key: "recommendationName", label: "Name" },
        { key: "productName", label: "Product Name", width: "150px" },
        { key: "vendor", label: "Product Vendor", width: "150px", sortable: true },
        { key: "remediationType", label: "Remediation", width: "80px", sortable: true },
        { key: "relatedComponent", label: "Related Component", width: "100px", sortable: true },
        { key: "exposureImpact", label: "Exposure Impact", width: "90px", sortable: true, render: (row) => Number(row.exposureImpact).toFixed(3) },
        { key: "configScoreImpact", label: "Config Score Impact", width: "90px", sortable: true, render: (row) => Number(row.configScoreImpact).toFixed(3) },
        { key: "publicExploit", label: "Public Exploit", width: "80px", sortable: true, render: (row) => <BooleanCell value={row.publicExploit} /> },
        { key: "activeAlert", label: "Active Alert", width: "80px", sortable: true, render: (row) => <BooleanCell value={row.activeAlert} /> },
        { key: "exposedMachinesCount", label: "Exposed Devices", width: "80px", sortable: true },
        { key: "totalMachinesCount", label: "Total Devices", width: "80px", sortable: true },
        { key: "exposedCriticalDevices", label: "Exposed Critical Devices", width: "100px", sortable: true },
        { key: "hasUnpatchableCve", label: "Has Unpatchable CVE?", width: "90px", sortable: true, render: (row) => <BooleanCell value={row.hasUnpatchableCve} /> },
        { key: "eventsLast24h", label: "Events Last 24h", width: "90px", sortable: true },
        {
            key: "actions", label: "Actions", render: (row) => (
                <Button
                    height={6}
                    onClick={() => handleViewRecommendation(row)}
                >
                    View
                </Button>
            )
        }
    ], []);

    return (
        <>
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
                <Text>Please note this page is still in development and some features may be missing or broken.</Text>
            </Flex>

            <Flex gap={1.5} marginBottom={4}>
                <Stat
                    icon={<LuFolderSync />}
                    label="Last Sync"
                    value={<DateTextWithHover date={recLastSync} reverse withTime />}
                    bgColor="blue.100"
                    color="blue.700"
                />
                <Stat
                    icon={<LuTriangleAlert />}
                    label="Public Exploit"
                    value={stats?.totalWithPublicExploit ?? "-"}
                    bgColor="orange.100"
                    color="orange.700"
                />
                <Stat
                    icon={<LuTriangleAlert />}
                    label="Has Critical Devices"
                    value={stats?.totalWithCriticalDevices ?? "-"}
                    bgColor="red.100"
                    color="red.700"
                />
                <Stat
                    icon={<LuTriangleAlert />}
                    label="Active Alert"
                    value={stats?.totalWithActiveAlert ?? "-"}
                    bgColor="red.100"
                    color="red.700"
                />
                {/* <Stat
                    icon={<LuTrendingUp />}
                    label="Events Last 24h"
                    value={recommendations.reduce((total, r) => total + (r.eventsLast24h ?? 0), 0)}
                    bgColor="green.100"
                    color="green.700"
                /> */}
            </Flex>

            <OpenInDefenderButton
                url="https://security.microsoft.com/security-recommendations"
                customer={customer}
            />

            <DataTable
                id="client_recommendations_table"
                data={recommendations}
                columns={columns}
                defaultColumns={defaultColumns}
                state={state}
                tableQuery={tableQuery}
                tableMeta={tableMeta}
            />

            <ViewRecommendationDrawer
                open={viewDrawerOpen}
                onOpen={setViewDrawerOpen}
                recommendation={selectedRecommendation}
                customer={customer}
            />
        </>
    )
}