import { Column, DataTable, Filter } from "@/components/ui/base/DataTable";
import { Stat } from "@/components/ui/base/Stat";
import { toaster } from "@/components/ui/base/Toaster";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { BooleanCell } from "@/components/cell/BooleanCell";
import { AggregatedRecommendation } from "@/lib/entities/SecurityRecommendation";
import { Session } from "@/lib/entities/Session";
import { useTableQuery } from "@/lib/hooks/useTableQuery";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { Button, Flex, Heading } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { LuInfo } from "react-icons/lu";

const defaultColumns = [
    "recommendation_name",
    "product_name",
    "vendor",
    "total_clients_affected",
    "total_critical_devices",
    "has_public_exploit",
    "has_active_alert",
    "actions"
]

export default function Recommendations({ sidebarCollapsed }) {
    const [recommendations, setRecommendations] = useState<AggregatedRecommendation[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [remediationTypes, setRemediationTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [onlyWithExposure, setOnlyWithExposure] = useState(true);

    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    const {
        page,
        filters,
        sort,
        setPage,
        setFilters,
        setSort,
    } = useTableQuery<AggregatedRecommendation>();

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchData();
        }
    }, [sessionStatus, page, filters, sort]);

    async function fetchData() {
        setLoading(true);

        try {
            const params = buildTableParams({
                page,
                pageSize: 20,
                filters: { ...filters, onlyWithExposure },
                sort: sort.key ? { key: String(sort.key), direction: sort.direction } : undefined
            });

            const res = await fetch(`/api/recommendations/summary?${params}`);
            const data = await res.json();

            if (res.ok) {
                setRemediationTypes(data.remediationTypes);
                setRecommendations(data.recommendations);
                setTotalItems(data.totalItems);
                setTotalPages(data.totalPages);
            } else {
                toaster.create({ type: "error", title: data?.error ?? "Failed to fetch recommendations" });
            }
        } finally {
            setLoading(false);
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
        return <ErrorPage error={error} onRetry={fetchData} />
    }

    const filtersConfig: Filter<AggregatedRecommendation>[] = [
        { key: "recommendation_name", required: "recommendation_name", label: "Name", type: "text" },
        { key: "product_name", required: "product_name", label: "Product", type: "text" },
        { key: "vendor", required: "vendor", label: "Vendor", type: "text" },
        { key: "remediation_type", required: "remediation_type", label: "Remediation", type: "select", options: remediationTypes.map(r => ({ label: r, value: r })) },
        { key: "related_component", required: "related_component", label: "Component", type: "text" }
    ];

    const columns: Column<AggregatedRecommendation>[] = [
        { key: "id", label: "Internal ID", width: "80px" },
        { key: "defender_recommendation_id", label: "Defender ID", width: "60px" },
        { key: "recommendation_name", label: "Name" },
        { key: "product_name", label: "Product Name", width: "120px" },
        { key: "vendor", label: "Product Vendor", width: "150px", sortable: true },
        { key: "remediation_type", label: "Remediation", width: "80px", sortable: true },
        { key: "related_component", label: "Related Component", width: "100px", sortable: true },
        { key: "has_public_exploit", label: "Public Exploit", width: "80px", sortable: true, render: (row) => <BooleanCell value={row.has_public_exploit} /> },
        { key: "has_active_alert", label: "Active Alert", width: "80px", sortable: true, render: (row) => <BooleanCell value={row.has_active_alert} /> },
        { key: "total_clients_affected", label: "Affected Clients", width: "70px", sortable: true },
        { key: "total_critical_devices", label: "Critical Devices", width: "70px", sortable: true },
        { key: "events_last_24h", label: "Events Last 24h", width: "90px", sortable: true },
        {
            key: "actions", label: "Actions", render: (row) => (
                <Button
                    height={6}
                // onClick={() => handleViewRecommendation(row)}
                >
                    View
                </Button>
            )
        }
    ];

    return (
        <Page
            title="Security Recommendations"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Heading size="3xl" marginBottom={4}>Security Recommendations</Heading>

            <Flex gap={2} flexWrap="wrap" marginBottom={4}>
                <Stat
                    icon={<LuInfo />}
                    label="Total Recommendations"
                    value={totalItems}
                    bgColor="blue.100"
                    color="blue.700"
                />
            </Flex>

            <DataTable
                id="recommendations_summary_table"
                data={recommendations}
                columns={columns}
                defaultColumns={defaultColumns}
                filterState={filters}
                filters={filtersConfig}
                sort={sort}
                onFilterChange={setFilters}
                onSortChange={(key, direction) => setSort(key)}
                onPageChange={setPage}
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
            />
        </Page>
    );
}
