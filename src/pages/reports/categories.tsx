import { CreateReportCategoryDrawer } from "@/components/reports/CreateReportCategoryDrawer";
import { UpdateReportCategoryDrawer } from "@/components/reports/UpdateReportCategoryDrawer";
import { Column, DataTable } from "@/components/ui/base/DataTable";
import { TableState } from "@/components/ui/base/TableStateWrapper";
import { toaster } from "@/components/ui/base/Toaster";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { AgentPermission, hasPermission } from "@/lib/agents/permissions";
import { useTableMeta } from "@/lib/hooks/useTableMeta";
import { Filter, useTableQuery } from "@/lib/hooks/useTableQuery";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { requireAuth } from "@/lib/utils/requireAuthPage";
import { Button, Flex, Heading, Tabs } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { LuPencil, LuPlus } from "react-icons/lu";

export const getServerSideProps = requireAuth(async (ctx) => {
    return { props: {} }
});

const tableFilters: Filter<any>[] = [
    { key: "name", required: "name", label: "Name", type: "text" }
];

const defaultColumns = [
    "name",
    "description",
    "created_at",
    "updated_at",
    "actions"
];

const TAB_ROUTES = {
    "report-list": "/reports",
    "report-categories": "/reports/categories"
}

export default function ReportCategories({ session, sidebarCollapsed }) {
    const [rows, setRows] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [state, setState] = useState<TableState>(TableState.LOADING);

    const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
    const [editDrawerOpen, setEditDrawerOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

    const router = useRouter();

    const tableQuery = useTableQuery<any>(20, tableFilters);
    const { tableMeta, setTableMeta } = useTableMeta();

    useEffect(() => {
        fetchCategories();
    }, [tableQuery.state.page, tableQuery.state.sort, tableQuery.state.filters]);


    async function fetchCategories() {
        try {
            setState(TableState.LOADING);
            setError("");

            const params = buildTableParams(tableQuery);
            const res = await fetch(`/api/reports/categories?${params}`);
            const data = await res.json();

            if (!res.ok) {
                setState(TableState.FAILED);
                return;
            }

            setRows(data.rows ?? data);
            if (data.meta) {
                setTableMeta(data.meta);
            }
            setState(TableState.LOADED);
        } catch (e) {
            console.error(e);
            setState(TableState.FAILED);
            setError(e.message || "An unknown error has occurred");
        }
    }

    async function deleteCategory(row: any) {
        try {
            const res = await fetch(`/api/reports/categories/${row.id}`, {
                method: "DELETE"
            });
           
            fetchCategories();
            toaster.create({ title: "Category deleted", type: "success" });
        } catch (e) {
            console.error(e);
            setError(e.message || "An unknown error has occurred while deleting category");
        }
    }

    const columns: Column<any>[] = useMemo(() => [
        { key: "id", label: "ID", width: "120px", sortable: true },
        { key: "name", label: "Name", width: "250px", sortable: true },
        { key: "description", label: "Description" },
        { key: "created_at", label: "Created At", width: "160px", render: (row) => <DateTextWithHover date={row.created_at} /> },
        { key: "updated_at", label: "Last Updated", width: "160px", render: (row) => <DateTextWithHover date={row.updated_at} /> }, {
            key: "actions",
            label: "Actions",
            render: (row) => {
                return (
                    <Flex gap={1} alignItems="center">
                        <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => {
                                setSelectedCategory(row);
                                setEditDrawerOpen(true);
                            }}
                            aria-label="Edit report category"
                            disabled={!hasPermission(session, AgentPermission.REPORT_CATEGORY_EDIT)}
                        >
                            <LuPencil />
                        </Button>

                        <Button
                            size="xs"
                            colorPalette="red"
                            height={6}
                            onClick={() => {
                                if (confirm("Are you sure you want to delete this category?")) {
                                    deleteCategory(row);
                                }
                            }}
                            aria-label="Delete report category"
                            disabled={!hasPermission(session, AgentPermission.REPORT_CATEGORY_DELETE)}
                        >
                            Delete
                        </Button>
                    </Flex>
                );
            }
        }
    ], []);

    if (!router.isReady) {
        return <SkeletonPage />;
    }

    if (!session) {
        router.push("/login");
        return false;
    }

    if (error) {
        return <ErrorPage error={error} />;
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

                <Tabs.Content value="report-categories">
                    <Flex justifyContent="space-between">
                        <Heading size="3xl" marginBottom={4}>Report Categories</Heading>

                        {hasPermission(session, AgentPermission.REPORT_CATEGORY_CREATE) && (
                            <Flex gap={4}>
                                <Button
                                    size="sm"
                                    onClick={() => setCreateDrawerOpen(true)}
                                    height={8}
                                >
                                    <LuPlus /> Create Category
                                </Button>
                            </Flex>
                        )}
                    </Flex>

                    <DataTable
                        id="report_categories_table"
                        data={rows}
                        columns={columns}
                        defaultColumns={defaultColumns}
                        state={state}
                        tableMeta={tableMeta}
                        tableQuery={tableQuery}
                        error={error}
                    />
                </Tabs.Content>
            </Tabs.Root>

            <CreateReportCategoryDrawer
                open={createDrawerOpen}
                onClose={() => setCreateDrawerOpen(false)}
                onSuccess={() => {
                    setCreateDrawerOpen(false);
                    fetchCategories();
                }}
            />

            <UpdateReportCategoryDrawer
                open={editDrawerOpen}
                onClose={() => setEditDrawerOpen(false)}
                onSuccess={() => {
                    setEditDrawerOpen(false);
                    fetchCategories();
                }}
                category={selectedCategory}
            />
        </Page>
    )
}