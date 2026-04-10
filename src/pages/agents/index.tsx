import { CreateAgentDrawer } from "@/components/agents/CreateAgentDrawer";
import { UpdateAgentDrawer } from "@/components/agents/UpdateAgentDrawer";
import { ReasonModal } from "@/components/ReasonModal";
import { Column, DataTable, Filter } from "@/components/ui/base/DataTable";
import { toaster } from "@/components/ui/base/Toaster";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { Agent, AgentRole, formatAgentRole } from "@/lib/entities/Agent";
import { Session } from "@/lib/entities/Session";
import { useTableQuery } from "@/lib/hooks/useTableQuery";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { checkAgentRole } from "@/lib/utils/utils";
import { Button, Flex, Heading } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { LuPencil, LuPlus } from "react-icons/lu";

const filtersConfig: Filter<Agent>[] = [
    { key: "display_name", required: "display_name", label: "Name", type: "text" },
    { key: "email", required: "email", label: "Email", type: "text" },
    { key: "role", required: "role", label: "Role", type: "select", options: Object.values(AgentRole).map((a) => ({ label: formatAgentRole(a.toString() as AgentRole), value: a.toString() })) },
    { key: "enabled", required: "deleted_at", label: "Enabled", type: "boolean" }
];

const defaultColumns = [
    "display_name",
    "email",
    "role",
    "created_at",
    "deleted_at",
    "actions"
];

export default function Agents({ sidebarCollapsed }) {
    const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
    const [updateDrawerOpen, setUpdateDrawerOpen] = useState(false);
    const [disableReasonModalOpen, setDisableReasonModalOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

    const [loadingAgents, setLoadingAgents] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(1);

    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    const {
        page,
        filters,
        sort,
        setPage,
        setFilters,
        setSort,
    } = useTableQuery<Agent>();

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchAgents();
        }
    }, [sessionStatus, page, filters, sort]);

    async function fetchAgents() {
        setLoadingAgents(true);
        setError(null);

        try {
            const params = buildTableParams({
                page,
                pageSize: 20,
                filters,
                sort: sort.key ? {
                    key: String(sort.key),
                    direction: sort.direction
                } : undefined
            });

            const res = await fetch(`/api/agents?${params}`);

            if (!res.ok) {
                throw new Error("Failed to fetch agents");
            }

            const data = await res.json();

            setAgents(data.agents);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        } catch (e) {
            console.error(e);
            setError(e.message || "An unknown error has occurred");
        } finally {
            setLoadingAgents(false);
        }
    }

    async function handleDisableAgent(reason: string) {
        try {
            const res = await fetch(`/api/agents/${selectedAgent?.id}/disable`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ reason })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data?.error || "Failed to disable agent");
            }

            toaster.create({ type: "success", title: "Agent disabled" });
            fetchAgents();
        } catch (e) {
            console.error(e);
            toaster.create({ type: "error", title: e.message });
        }
    }

    async function handleEnableAgent(agent: Agent) {
        try {
            const res = await fetch(`/api/agents/${agent?.id}/enable`, {
                method: "POST"
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data?.error || "Failed to enable agent");
            }

            toaster.create({ type: "success", title: "Agent enabled" });
            fetchAgents();
        } catch (e) {
            console.error(e);
            toaster.create({ type: "error", title: e.message });
        }
    }

    function handleRowClick(agent: Agent) {
        setSelectedAgent(agent);
        setUpdateDrawerOpen(true);
    }

    function handleDisableRowClick(agent: Agent) {
        setSelectedAgent(agent);
        setDisableReasonModalOpen(true);
    }

    function handleEnableRowClick(agent: Agent) {
        setSelectedAgent(agent);
        handleEnableAgent(agent);
    }

    const columns: Column<Agent>[] = useMemo(() => [
        { key: "id", label: "ID", width: "150px", sortable: true },
        { key: "display_name", label: "Name", width: "120px", sortable: true },
        { key: "email", label: "Email", width: "200px", sortable: true },
        { key: "role", label: "Role", width: "250px", render: (row) => formatAgentRole(row.role as AgentRole) },
        { key: "entra_object_id", label: "Entra Object ID", width: "250px" },
        { key: "created_at", label: "Creation Date", width: "150px", sortable: true, render: (row) => <DateTextWithHover date={row.created_at} withTime /> },
        { key: "deleted_at", label: "Disable Date", width: "150px", sortable: true, render: (row) => <DateTextWithHover date={row.deleted_at} withTime /> },
        {
            key: "actions",
            label: "Actions",
            render: (row) => {
                return (
                    <Flex gap={1} alignItems="center">
                        <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleRowClick(row)}
                            aria-label="Edit agent"
                            disabled={!checkAgentRole(session, AgentRole.ADMIN)}
                        >
                            <LuPencil />
                        </Button>

                        {checkAgentRole(session, AgentRole.ADMIN) && (
                            <>
                                {row.deleted_at ? (
                                    <Button
                                        size="xs"
                                        height={6}
                                        variant="outline"
                                        bgColor="blue.100"
                                        onClick={() => handleEnableRowClick(row)}
                                    >
                                        Enable
                                    </Button>
                                ) : (
                                    <Button
                                        size="xs"
                                        height={6}
                                        variant="outline"
                                        bgColor="orange.100"
                                        onClick={() => handleDisableRowClick(row)}
                                    >
                                        Disable
                                    </Button>
                                )}
                            </>
                        )}
                    </Flex>
                );
            }
        }
    ], [session]);

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

    return (
        <Page
            title="Agents"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Flex justifyContent="space-between">
                <Heading size="3xl" marginBottom={4}>Agents</Heading>

                {checkAgentRole(session, AgentRole.ADMIN) && (
                    <Button
                        size="sm"
                        onClick={(e) => setCreateDrawerOpen(true)}
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
                        <LuPlus /> Create Agent
                    </Button>
                )}
            </Flex>

            <DataTable
                id="agents_table"
                data={agents}
                columns={columns}
                defaultColumns={defaultColumns}
                filters={filtersConfig}
                filterState={filters}
                sort={sort}
                onFilterChange={setFilters}
                onSortChange={(key, direction) => setSort(key)}
                onPageChange={setPage}
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                loading={loadingAgents}
                error={error}
            />

            <CreateAgentDrawer
                open={createDrawerOpen}
                onClose={() => setCreateDrawerOpen(false)}
                onSuccess={() => {
                    setCreateDrawerOpen(false);
                    fetchAgents();
                    toaster.create({ type: "success", title: "Agent has been created" });
                }}
            />
            <UpdateAgentDrawer
                open={updateDrawerOpen}
                onClose={() => setUpdateDrawerOpen(false)}
                onSuccess={() => {
                    setUpdateDrawerOpen(false);
                    fetchAgents();
                    toaster.create({ type: "success", title: "Agent has been updated" });
                }}
                agent={selectedAgent}
            />
            <ReasonModal
                open={disableReasonModalOpen}
                onCancel={() => setDisableReasonModalOpen(false)}
                onSuccess={(reason: string) => {
                    setDisableReasonModalOpen(false);
                    handleDisableAgent(reason);
                }}
                title="Disable User"
                summary={`Please describe why you want to disable ${selectedAgent?.display_name}.`}
                minLength={5}
            />
        </Page>
    )
}