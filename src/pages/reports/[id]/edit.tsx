import { ContentBox } from "@/components/reports/ContentBox";
import { ReportDetailsTab } from "@/components/reports/tabs/ReportDetailsTab";
import { ReportPreviewTab } from "@/components/reports/tabs/ReportPreviewTab";
import { ReportSqlTab } from "@/components/reports/tabs/ReportSqlTab";
import { toaster } from "@/components/ui/base/Toaster";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { AgentRole } from "@/lib/entities/Agent";
import { ServerSession, Session } from "@/lib/entities/Session";
import { pool } from "@/lib/mysql";
import { checkAgentRole } from "@/lib/utils/utils";
import { Button, Heading, Tabs } from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { getAuthOptions } from "../../api/auth/[...nextauth]";

export interface ReportForm {
    name: string;
    description?: string;
    is_public: boolean;
    sql_query: string;
}


export const getServerSideProps: GetServerSideProps = async ({ req, res, params }) => {
    const id = params?.id;

    if (!id || Array.isArray(id)) {
        return { notFound: true }
    }

    const session = await getServerSession(req, res, await getAuthOptions()) as ServerSession;
    const admin = session.agent.role === AgentRole.ADMIN;

    const [report]: any = await pool.execute(
        `SELECT
            reports.id,
            reports.created_at,
            reports.updated_at,
            reports.name,
            reports.description,
            reports.is_public,
            ${admin ? "reports.sql_query," : ""}
            reports.created_by_agent_id,
            agents.display_name AS created_by_agent_name
        FROM reports
        LEFT JOIN agents ON reports.created_by_agent_id = agents.id
        WHERE reports.id = ?
        ${admin ? "" : "AND reports.is_public = 1"}
        `, [id]
    );

    if (!report || report.length === 0) {
        return { notFound: true }
    }

    return {
        props: {
            report: JSON.parse(JSON.stringify(report[0]))
        }
    }
}

export default function EditReport({ report, sidebarCollapsed }) {
    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState<ReportForm>({
        name: report.name ?? "",
        description: report.description ?? "",
        is_public: Boolean(report.is_public) ?? true,
        sql_query: report.sql_query ?? ""
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

    async function executeReport() {
        setLoading(true);
        setError(null);
        setData([]);

        try {
            const response = await fetch(`/api/reports/${report.id}/execute`, {
                method: "POST"
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

    function loadPreviewOrExecute() {
        if (checkAgentRole(session, AgentRole.ADMIN)) {
            loadPreview();
        } else {
            executeReport();
        }
    }

    async function updateReport() {
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
            const response = await fetch("/api/reports/" + report.id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(form)
            });

            const data = await response.json();

            if (data?.error) {
                toaster.create({ title: "Failed to update report", description: data.error, type: "error" });
                return;
            }

            toaster.create({ title: "Report updated", type: "success" });
            router.push("/reports");
        } catch (e) {
            console.error(e);
            setError(e.message || "An unknown error has occurred");
        } finally {
            setLoading(false);
        }
    }

    async function deleteReport() {
        if (!confirm("Are you sure you want to delete this report? It cannot be undone!")) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/reports/" + report.id, {
                method: "DELETE"
            });

            const data = await response.json();

            if (data?.error) {
                toaster.create({ title: "Failed to delete report", description: data.error, type: "error" });
                return;
            }

            toaster.create({ title: "Report deleted", type: "success" });
            router.push("/reports");
        } catch (e) {
            console.error(e);
            toaster.create({ title: e.message, type: "success" });
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
            title="Edit Report"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Heading size="3xl" marginBottom={4}>Edit Report</Heading>

            <Tabs.Root height="90%" defaultValue="report-details" variant="plain" orientation="vertical">
                <Tabs.List gap={1} bg="white" height="100%" rounded="l3" p="1" >
                    <Tabs.Trigger value="report-details" fontSize="20px" width="200px">Details</Tabs.Trigger>
                    {checkAgentRole(session, AgentRole.ADMIN) && (
                        <Tabs.Trigger value="report-sql" fontSize="20px" width="200px">SQL</Tabs.Trigger>
                    )}
                    <Tabs.Trigger value="report-preview" fontSize="20px" width="200px">Preview</Tabs.Trigger>
                    <Tabs.Indicator bgColor="blue.100" />

                    <Button
                        marginTop={6}
                        height={8}
                        width="100px"
                        alignSelf="center"
                        onClick={() => updateReport()}
                        disabled={!checkAgentRole(session, AgentRole.ADMIN)}
                    >
                        Update
                    </Button>

                    <Button
                        marginTop={2}
                        width="100px"
                        height={8}
                        alignSelf="center"
                        colorPalette="red"
                        onClick={() => deleteReport()}
                        disabled={!checkAgentRole(session, AgentRole.ADMIN)}
                    >
                        Delete
                    </Button>
                </Tabs.List>
                <Tabs.Content value="report-details" width="100%">
                    <ContentBox>
                        <ReportDetailsTab session={session} report={report} form={form} update={update} />
                    </ContentBox>
                </Tabs.Content>
                {checkAgentRole(session, AgentRole.ADMIN) && (
                    <Tabs.Content value="report-sql" width="100%">
                        <ContentBox>
                            <ReportSqlTab form={form} update={update} />
                        </ContentBox>
                    </Tabs.Content>
                )}
                <Tabs.Content value="report-preview" width="100%">
                    <ContentBox>
                        <ReportPreviewTab
                            loadPreviewOrExecute={loadPreviewOrExecute}
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