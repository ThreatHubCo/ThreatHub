import { ContentBox } from "@/components/reports/ContentBox";
import { ReportDetailsTab } from "@/components/reports/tabs/ReportDetailsTab";
import { ReportPreviewTab } from "@/components/reports/tabs/ReportPreviewTab";
import { ReportSqlTab } from "@/components/reports/tabs/ReportSqlTab";
import { toaster } from "@/components/ui/base/Toaster";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { Session } from "@/lib/entities/Session";
import { Box, Button, Heading, Tabs } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { PropsWithChildren, useState } from "react";

export interface ReportForm {
    name: string;
    description?: string;
    is_public: boolean;
    sql_query: string;
}

export default function CreateReport({ sidebarCollapsed }) {
    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState<ReportForm>({
        name: "",
        description: "",
        is_public: true,
        sql_query: ""
    });

    async function loadPreview() {
        setLoading(true);
        setError(null);
        setData([]);

        try {
            const response = await fetch("/api/reports/preview", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    sql: form.sql_query
                })
            });

            const data = await response.json();

            if (data?.error) {
                setError(data.error);
            } else {
                setData(data);
                return data;
            }
        } catch (e) {
            console.error(e);
            setError(e.message || "An unknown error has occurred");
        } finally {
            setLoading(false);
        }
        return null;
    }

    async function createReport() {
        try {
            const data = await loadPreview();

            if (data.length === 0) {
                return toaster.create({ title: "Failed to save", description: "There was an error with your SQL. Check the Preview tab.", type: "error" });
            }
        } catch (e) {
            return toaster.create({ title: "Failed to save", description: "There was an error with your SQL. Check the Preview tab.", type: "error" });
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/reports/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(form)
            });

            const data = await response.json();

            if (data?.error) {
                toaster.create({ title: "Failed to create report", description: data.error, type: "error" });
                return;
            }

            toaster.create({ title: "Report created", type: "success" });
            router.push("/reports");
        } catch (e) {
            console.error(e);
            setError(e.message || "An unknown error has occurred");
        } finally {
            setLoading(false);
        }
    }

    function update<K extends keyof ReportForm>(key: K, value: ReportForm[K]) {
        setForm(prev => ({ ...prev, [key]: value }));
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
            title="Create Report"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Heading size="3xl" marginBottom={4}>Create Report</Heading>

            <Tabs.Root 
                height="90%" 
                defaultValue="report-details" 
                variant="plain" 
                orientation="vertical"
                flexDirection={{ base: "column", md: "row" }}
                rowGap={4}
            >
                <Tabs.List
                    gap={1}
                    bg="white"
                    height="100%"
                    rounded="l3"
                    p="1"
                >
                    <Tabs.Trigger value="report-details" fontSize="20px" width={{ base: "100%", md: "200px" }}>Details</Tabs.Trigger>
                    <Tabs.Trigger value="report-sql" fontSize="20px" width={{ base: "100%", md: "200px" }}>SQL</Tabs.Trigger>
                    <Tabs.Trigger value="report-preview" fontSize="20px" width={{ base: "100%", md: "200px" }}>Preview</Tabs.Trigger>
                    <Tabs.Indicator bgColor="blue.100" />

                    <Button
                        marginTop={6}
                        size="xs"
                        width="100px"
                        alignSelf="center"
                        onClick={() => createReport()}
                    >
                        Save
                    </Button>
                </Tabs.List>
                <Tabs.Content value="report-details" width="100%">
                    <ContentBox>
                        <ReportDetailsTab session={session} form={form} update={update} />
                    </ContentBox>
                </Tabs.Content>
                <Tabs.Content value="report-sql" width="100%">
                    <ContentBox>
                        <ReportSqlTab form={form} update={update} />
                    </ContentBox>
                </Tabs.Content>
                <Tabs.Content value="report-preview" width="100%">
                    <ContentBox>
                        <ReportPreviewTab
                            loadPreviewOrExecute={loadPreview}
                            data={data}
                            loading={loading}
                            error={error}
                            session={session}
                        />
                    </ContentBox>
                </Tabs.Content>
            </Tabs.Root>
        </Page>
    )
}