import { AgentPermission, hasPermission } from "@/lib/agents/permissions";
import { ServerSession } from "@/lib/entities/Session";
import { Link, Tabs } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

interface Props {
    tab: string;
    session: ServerSession;
}

export function AdminConfigPageTabs({ tab, session, children }: PropsWithChildren<Props>) {
    
    const permissions = {
        admin: hasPermission(session, AgentPermission.ADMIN_CONFIG_VIEW),
        roles: hasPermission(session, AgentPermission.ADMIN_ROLES_VIEW),
        agents: hasPermission(session, AgentPermission.ADMIN_AGENTS_VIEW)
    }

    return (
        <Tabs.Root value={tab}>
            <Tabs.List marginBottom={2}>
                {permissions.admin && (
                    <Tabs.Trigger justifyContent="center" value="admin" asChild>
                        <Link outline="none" href="/admin/config">General Configuration</Link>
                    </Tabs.Trigger>
                )}
                {permissions.roles && (
                    <Tabs.Trigger justifyContent="center" value="roles" asChild>
                        <Link outline="none" href="/admin/config/roles">Roles</Link>
                    </Tabs.Trigger>
                )}
                {permissions.agents && (
                    <Tabs.Trigger justifyContent="center" value="agents" asChild>
                        <Link outline="none" href="/admin/config/agents">Agents</Link>
                    </Tabs.Trigger>
                )}
            </Tabs.List>

            {permissions.admin && (
                <Tabs.Content value="admin">
                    {tab === "admin" && children}
                </Tabs.Content>
            )}
            {permissions.roles && (
                <Tabs.Content value="roles">
                    {tab === "roles" && children}
                </Tabs.Content>
            )}
            {permissions.agents && (
                <Tabs.Content value="agents">
                    {tab === "agents" && children}
                </Tabs.Content>
            )}
        </Tabs.Root>
    );
}