import { toaster } from "@/components/ui/base/Toaster";
import { AGENT_PERMISSION_GROUPS, AgentPermission, getAgentPermissionDescription } from "@/lib/agents/permissions";
import { Button, Checkbox, CloseButton, Drawer, Field, Heading, Input, Portal, Stack, Text, Textarea } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface Props {
    open: boolean;
    role: any | null;
    onClose: () => void;
    onSuccess: () => void;
}

const EMPTY_FORM = {
    name: "",
    summary: "",
    permissions: []
}

export function RoleDrawer({
    open,
    role,
    onClose,
    onSuccess
}: Props) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditing = role !== null;

    useEffect(() => {
        if (!open) {
            return;
        }

        setForm(role ? {
            name: role.name,
            summary: role.summary ?? "",
            permissions: [...role.permissions]
        } : { ...EMPTY_FORM, permissions: [] });

        setError(null);
    }, [open, role]);

    function togglePermission(permission: AgentPermission, checked: boolean) {
        setForm(prev => ({
            ...prev,
            permissions: checked
                ? [...new Set([...prev.permissions, permission])]
                : prev.permissions.filter(p => p !== permission)
        }));
    }

    async function handleSubmit() {
        setError(null);

        try {
            setLoading(true);

            const res = await fetch(
                isEditing ? `/api/admin/roles/${role.id}` : "/api/admin/roles",
                {
                    method: isEditing ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: form.name.trim(),
                        summary: form.summary.trim() || null,
                        permissions: form.permissions
                    })
                }
            );

            if (!res.ok) {
                const body = await res.json();
                throw new Error(body?.error || "Failed to save role");
            }

            toaster.create({
                title: isEditing ? "Role updated" : "Role created",
                type: "success"
            });

            onSuccess();
            onClose();
        } catch (e: any) {
            setError(e.message ?? "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!role) {
            return;
        }
        setError(null);

        try {
            setLoading(true);

            const res = await fetch(`/api/admin/roles/${role.id}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                const body = await res.json();
                throw new Error(body?.error || "Failed to delete role");
            }

            toaster.create({
                title: "Role deleted",
                type: "success"
            });

            onSuccess();
            onClose();
        } catch (e: any) {
            setError(e.message ?? "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Drawer.Root
            open={open}
            onOpenChange={({ open }) => {
                if (!open && !loading) {
                    onClose();
                }
            }}
            size="lg"
            placement="end"
        >
            <Portal>
                <Drawer.Backdrop />

                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.Header>
                            <Drawer.Title>
                                {isEditing ? "Edit Role" : "Create Role"}
                            </Drawer.Title>
                        </Drawer.Header>

                        <Drawer.Body>
                            <Stack gap={6}>
                                <Field.Root required>
                                    <Field.Label>Role Name</Field.Label>
                                    <Input
                                        value={form.name}
                                        onChange={e =>
                                            setForm(prev => ({
                                                ...prev,
                                                name: e.target.value
                                            }))
                                        }
                                        placeholder="e.g. Security Analyst"
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Summary</Field.Label>
                                    <Textarea
                                        value={form.summary}
                                        onChange={e =>
                                            setForm(prev => ({
                                                ...prev,
                                                summary: e.target.value
                                            }))
                                        }
                                        placeholder="Describe this role"
                                        maxLength={255}
                                    />
                                </Field.Root>

                                <Stack gap={1}>
                                    <Heading size="md">Permissions</Heading>
                                    <Text fontSize="sm" color="fg.muted">
                                        {form.permissions.length} of {Object.values(AgentPermission).length} permissions selected
                                    </Text>
                                </Stack>

                                {Object.entries(AGENT_PERMISSION_GROUPS).map(
                                    ([group, permissions]) => (
                                        <Stack key={group} gap={3}>
                                            <Heading size="sm">
                                                {group}
                                            </Heading>

                                            {permissions.map(permission => (
                                                <Checkbox.Root
                                                    key={permission}
                                                    checked={form.permissions.includes(permission)}
                                                    onCheckedChange={e => togglePermission(permission, e.checked === true)}
                                                >
                                                    <Checkbox.HiddenInput />
                                                    <Checkbox.Control />
                                                    <Checkbox.Label>
                                                        <Stack gap={1}>
                                                            <Text>{permission}</Text>

                                                            <Text fontSize="sm" color="fg.muted">
                                                                {getAgentPermissionDescription(permission)}
                                                            </Text>
                                                        </Stack>
                                                    </Checkbox.Label>
                                                </Checkbox.Root>
                                            ))}
                                        </Stack>
                                    )
                                )}

                                {error && (
                                    <Text color="red.500" fontSize="sm">
                                        {error}
                                    </Text>
                                )}
                            </Stack>
                        </Drawer.Body>

                        <Drawer.Footer>
                            {isEditing && (
                                <Button
                                    variant="outline"
                                    colorPalette="red"
                                    onClick={handleDelete}
                                    loading={loading}
                                    marginRight="auto"
                                >
                                    Delete Role
                                </Button>
                            )}

                            <Drawer.ActionTrigger asChild>
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                            </Drawer.ActionTrigger>

                            <Button
                                onClick={handleSubmit}
                                loading={loading}
                                disabled={!form.name.trim()}
                            >
                                {isEditing ? "Save Changes" : "Create Role"}
                            </Button>
                        </Drawer.Footer>

                        <Drawer.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Drawer.CloseTrigger>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
}