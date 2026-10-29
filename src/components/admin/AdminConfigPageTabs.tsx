import { Link, Tabs } from "@chakra-ui/react";

export function AdminConfigPageTabs({ tab, children }) {
    return (
        <Tabs.Root value={tab}>
            <Tabs.List marginBottom={2}>
                <Tabs.Trigger justifyContent="center" value="admin" asChild>
                    <Link outline="none" href="/admin/config">General Configuration</Link>
                </Tabs.Trigger>

                <Tabs.Trigger justifyContent="center" value="roles" asChild>
                    <Link outline="none" href="/admin/config/roles">Roles</Link>
                </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="admin">
                {tab === "admin" && (children)}
            </Tabs.Content>

            <Tabs.Content value="roles">
                {tab === "roles" && (children)}
            </Tabs.Content>
        </Tabs.Root>
    );
}