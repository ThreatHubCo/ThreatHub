import { CSVImportDrawer } from "@/components/CSVImportDrawer";
import { CreateCustomerDrawer } from "@/components/customers/CreateCustomerDrawer";
import { UpdateCustomerDrawer } from "@/components/customers/UpdateCustomerDrawer";
import { ReasonModal } from "@/components/ReasonModal";
import { Column, DataTable, Filter } from "@/components/ui/base/DataTable";
import { Stat } from "@/components/ui/base/Stat";
import { toaster } from "@/components/ui/base/Toaster";
import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { AgentRole } from "@/lib/entities/Agent";
import { Customer } from "@/lib/entities/Customer";
import { Session } from "@/lib/entities/Session";
import { useTableQuery } from "@/lib/hooks/useTableQuery";
import { buildTableParams } from "@/lib/utils/buildTableParams";
import { checkAgentRole } from "@/lib/utils/utils";
import { Button, Flex, Heading } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { LuImport, LuInfo, LuPencil, LuPlus, LuShieldBan } from "react-icons/lu";

const filtersConfig: Filter<Customer>[] = [
    { key: "name", required: "name", label: "Name", type: "text" },
    { key: "tenant_id", required: "tenant_id", label: "Tenant ID", type: "text" },
    { key: "enabled", required: "deleted_at", label: "Enabled", type: "boolean", defaultValue: "true" }
];

const defaultColumns = [
    "name",
    "tenant_id",
    "supports_csp",
    "created_at",
    "deleted_at",
    "actions"
]

export default function Customers({ sidebarCollapsed }) {
    const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
    const [importDrawerOpen, setImportDrawerOpen] = useState(false);
    const [disableReasonModalOpen, setDisableReasonModalOpen] = useState(false);
    const [editDrawerOpen, setEditDrawerOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalDisabledItems, setTotalDisabledItems] = useState(0);

    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    const {
        page,
        filters,
        sort,
        setPage,
        setFilters,
        setSort
    } = useTableQuery<Customer>();

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchCustomers();
        }
    }, [sessionStatus, page, filters, sort]);

    async function fetchCustomers() {
        setLoadingCustomers(true);
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

            const res = await fetch(`/api/customers?${params}`);

            if (!res.ok) {
                throw new Error("Failed to fetch customers");
            }

            const data = await res.json();

            setCustomers(data.customers);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
            setTotalDisabledItems(data.totalDisabledItems);
        } catch (e) {
            console.error(e);
            setError(e.message || "An unknown error has occurred");
        } finally {
            setLoadingCustomers(false);
        }
    }

    async function handleDisableCustomer(reason: string) {
        try {
            const res = await fetch(`/api/customers/${selectedCustomer?.id}/disable`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ reason })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data?.error || "Failed to disable customer");
            }

            toaster.create({ type: "success", title: "Customer disabled" });
            fetchCustomers();
        } catch (e) {
            console.error(e);
            toaster.create({ type: "error", title: e.message });
        }
    }

    async function handleEnableCustomer(customer: Customer) {
        try {
            const res = await fetch(`/api/customers/${customer?.id}/enable`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data?.error || "Failed to enable customer");
            }

            toaster.create({ type: "success", title: "Customer enabled" });
            fetchCustomers();
        } catch (e) {
            console.error(e);
            toaster.create({ type: "error", title: e.message });
        }
    }

    function handleOpenCustomer(customer: Customer) {
        router.push(`/customers/${customer.id}`);
    }

    function handleEditCustomer(customer: Customer) {
        setSelectedCustomer(customer);
        setEditDrawerOpen(true);
    }

    function handleDisableRowClick(customer: Customer) {
        setSelectedCustomer(customer);
        setDisableReasonModalOpen(true);
    }

    function handleEnableRowClick(customer: Customer) {
        setSelectedCustomer(customer);
        handleEnableCustomer(customer);
    }

    const columns: Column<Customer>[] = useMemo(() => [
        { key: "id", label: "ID", width: "150px", sortable: true },
        { key: "name", label: "Name", width: "120px", sortable: true },
        { key: "tenant_id", label: "Tenant ID", width: "250px" },
        { key: "supports_csp", label: "Supports CSP?", width: "130px", render: (row) => row.supports_csp ? "Yes" : "No" },
        { key: "created_at", label: "Creation Date", width: "150px", sortable: true, render: (row) => <DateTextWithHover date={row.created_at} withTime /> },
        { key: "deleted_at", label: "Disable Date", width: "150px", sortable: true, render: (row) => <DateTextWithHover date={row.deleted_at} withTime /> },
        { key: "external_customer_id", label: "External Customer ID", width: "250px" },
        {
            key: "actions",
            label: "Actions",
            render: (row) => {
                return (
                    <Flex gap={1} alignItems="center">
                        {checkAgentRole(session, AgentRole.MANAGER) && (
                            <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleEditCustomer(row)}
                                aria-label="Edit customer"
                            >
                                <LuPencil />
                            </Button>
                        )}

                        {checkAgentRole(session, AgentRole.MANAGER) && (
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

                        <Button
                            height={6}
                            size="xs"
                            onClick={() => handleOpenCustomer(row)}
                            marginLeft={1}
                        >
                            Open Page
                        </Button>
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
            title="Customers"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Flex justifyContent="space-between">
                <Heading size="3xl" marginBottom={4}>Customers</Heading>

                <Flex gap={4}>
                    {checkAgentRole(session, AgentRole.MANAGER) && (
                        <Button
                            size="sm"
                            onClick={(e) => setCreateDrawerOpen(true)}
                            height={8}
                            bgColor="white"
                            color="black"
                            border="1px solid"
                            borderColor="gray.400"
                            _hover={{
                                bgColor: "blue.50",
                                transform: "scale(1.05)"
                            }}
                        >
                            <LuPlus /> Create Customer
                        </Button>
                    )}

                    {checkAgentRole(session, AgentRole.MANAGER) && (
                        <Button
                            size="sm"
                            onClick={(e) => setImportDrawerOpen(true)}
                            height={8}
                            bgColor="white"
                            color="black"
                            border="1px solid"
                            borderColor="gray.400"
                            _hover={{
                                bgColor: "blue.50",
                                transform: "scale(1.05)"
                            }}
                        >
                            <LuImport /> Import From CSV
                        </Button>
                    )}
                </Flex>
            </Flex>

            <Flex gap={4} marginBottom={4} flexWrap="wrap">
                <Stat
                    icon={<LuInfo />}
                    label="Total Customers"
                    value={loadingCustomers ? "-" : totalItems}
                    bgColor="blue.100"
                    color="blue.700"
                />

                <Stat
                    icon={<LuShieldBan />}
                    label="Disabled Customers"
                    value={loadingCustomers ? "-" : totalDisabledItems}
                    bgColor="orange.100"
                    color="orange.700"
                />
            </Flex>

            <DataTable
                id="customers_table"
                data={customers}
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
                loading={loadingCustomers}
                error={error}
            />

            <CreateCustomerDrawer
                open={createDrawerOpen}
                onOpen={setCreateDrawerOpen}
            />
            
            <UpdateCustomerDrawer
                open={editDrawerOpen}
                onOpen={setEditDrawerOpen}
                customer={selectedCustomer}
            />

            <CSVImportDrawer
                open={importDrawerOpen}
                onOpen={setImportDrawerOpen}
                title="Import Customers"
                endpoint="/api/customers/import"
                headers={[
                    "name",
                    "tenant_id",
                    "external_customer_id",
                    "supports_csp"
                ] as const}
                mapRow={(row) => ({
                    name: row.name,
                    tenant_id: row.tenant_id || undefined,
                    external_customer_id: row.external_customer_id || undefined,
                    supports_csp: row.supports_csp === "true"
                })}
            />
            <ReasonModal
                open={disableReasonModalOpen}
                onCancel={() => setDisableReasonModalOpen(false)}
                onSuccess={(reason: string) => {
                    setDisableReasonModalOpen(false);
                    handleDisableCustomer(reason);
                }}
                title="Disable Customer"
                summary={`Please describe why you want to disable ${selectedCustomer?.name}.`}
                warning="Please be aware that disabling a customer will prevent us from seeing up to date vulnerability information or having tickets raised automatically."
            />
        </Page>
    )
}