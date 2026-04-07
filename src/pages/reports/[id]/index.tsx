import { ReportPreviewTab } from "@/components/reports/tabs/ReportPreviewTab";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { AgentRole } from "@/lib/entities/Agent";
import { ServerSession, Session } from "@/lib/entities/Session";
import { pool } from "@/lib/mysql";
import { Box, BoxProps, Heading, Text } from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { PropsWithChildren, useState } from "react";
import { getAuthOptions } from "../../api/auth/[...nextauth]";
import { ContentBox } from "@/components/reports/ContentBox";

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

export default function ViewReport({ report, sidebarCollapsed }) {
    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

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

    if (sessionStatus === "loading" || !router.isReady) {
        return <SkeletonPage />
    }

    if (!session) {
        router.push("/login");
        return false;
    }

    return (
        <Page
            title={report.name}
            sidebarCollapsed={sidebarCollapsed}
        >
            <Heading size="3xl" marginBottom={1}>{report.name}</Heading>
            <Text>{report.description}</Text>

            <ContentBox marginTop={4}>
                <ReportPreviewTab
                    loadPreviewOrExecute={executeReport}
                    data={data}
                    loading={loading}
                    error={error}
                    session={session}
                    view={true}
                />
            </ContentBox>
        </Page>
    )
}