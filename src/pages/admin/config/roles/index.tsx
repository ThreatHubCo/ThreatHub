import { RoleDrawer } from "@/components/admin/roles/RoleDrawer";
import { Column, DataTable } from "@/components/ui/base/DataTable";
import { TableState } from "@/components/ui/base/TableStateWrapper";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { NotAuthorisedPage } from "@/components/ui/NotAuthorisedPage";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { AgentRole } from "@/lib/entities/Agent";
import { useTableQuery } from "@/lib/hooks/useTableQuery";
import { requireAuth } from "@/lib/utils/requireAuthPage";
import { Button, Heading, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { LuPencil, LuPlus } from "react-icons/lu";

export const getServerSideProps = requireAuth(async () => ({
    props: {}
}));

const defaultColumns = [
    "name",
    "summary",
    "permission_count",
    "created_at",
    "actions"
]

export default function AdminRoles({ session, sidebarCollapsed }) {
    const router = useRouter();

    const [roles, setRoles] = useState<any[]>([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [state, setState] = useState(TableState.LOADING);

    const tableQuery = useTableQuery<any>(20);

    useEffect(() => {
        fetchRoles();
    }, [tableQuery.state.sort]);

    async function fetchRoles() {
        try {
            setState(TableState.LOADING);
            setLoading(true);
            setError("");

            const res = await fetch("/api/admin/roles");

            if (!res.ok) {
                const body = await res.json();
                throw new Error(body?.error || "Failed to fetch roles");
            }

            setRoles(await res.json());
            setState(TableState.LOADED);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to fetch roles");
            setState(TableState.FAILED);
        } finally {
            setLoading(false);
        }
    }

    function openCreateDrawer() {
        setSelectedRole(null);
        setDrawerOpen(true);
    }

    function openEditDrawer(role) {
        setSelectedRole(role);
        setDrawerOpen(true);
    }

    function closeDrawer() {
        setDrawerOpen(false);
        setSelectedRole(null);
    }

    const columns: Column<any>[] = useMemo(() => [
        { key: "id", label: "ID", width: "80px", sortable: true },
        { key: "name", label: "Name", sortable: true },
        { key: "summary", label: "Summary", sortable: true },
        { key: "permission_count", label: "Permissions", width: "130px", render: (row) => row.permissions.length },
        { key: "created_at", label: "Creation Date", width: "150px", sortable: true, render: (row) => <DateTextWithHover date={row.created_at} withTime /> },
        {
            key: "actions",
            label: "Actions",
            render: (row) => {
                return (
                    <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => openEditDrawer(row)}
                        aria-label="Edit agent"
                    >
                        <LuPencil />
                    </Button>
                );
            }
        }
    ], [session]);


    if (!router.isReady || loading) {
        return <SkeletonPage />;
    }

    if (!session) {
        router.push("/login");
        return false;
    }

    if (session?.agent?.role !== AgentRole.ADMIN) {
        return <NotAuthorisedPage />;
    }

    if (error) {
        return <ErrorPage error={error} />;
    }

    return (
        <Page
            title="Administration"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Stack
                direction={{ base: "column", sm: "row" }}
                justify="space-between"
                align={{ base: "stretch", sm: "center" }}
                marginBottom={6}
            >
                <Heading size="3xl">
                    Roles & Permissions
                </Heading>

                <Button
                    size="sm"
                    onClick={(e) => openCreateDrawer()}
                    height={8}
                    colorPalette="brand"
                >
                    <LuPlus /> Create Role
                </Button>
            </Stack>

            <Stack gap={3}>
                {roles.length === 0 ? (
                    <Text color="fg.muted">
                        No roles have been created yet.
                    </Text>
                ) : (
                    <DataTable
                        id="admin_roles_table"
                        data={roles}
                        columns={columns}
                        defaultColumns={defaultColumns}
                        error={error}
                        tableQuery={tableQuery}
                        state={state}
                    />
                )}
            </Stack>

            <RoleDrawer
                open={drawerOpen}
                role={selectedRole}
                onClose={closeDrawer}
                onSuccess={fetchRoles}
            />
        </Page>
    );
}