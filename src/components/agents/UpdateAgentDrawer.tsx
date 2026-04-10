import { Agent, AgentRole } from "@/lib/entities/Agent";
import {
    Box,
    Button,
    CloseButton,
    Drawer,
    Field,
    Input,
    NativeSelect,
    Portal,
    Text,
    VStack
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { toaster } from "../ui/base/Toaster";

interface AgentWithInfo extends Agent {
    has_password: boolean;
}

interface UpdateAgentDrawerProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    agent: Partial<AgentWithInfo> | null;
}

interface AgentForm {
    email: string;
    display_name: string;
    password: string;
    entra_object_id: string;
    role: AgentRole;
}

export function UpdateAgentDrawer({ open, onClose, onSuccess, agent }: UpdateAgentDrawerProps) {
    return (
        <Drawer.Root
            size="md"
            open={open}
            onOpenChange={({ open }) => onClose()}
        >
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        {open ? <DrawerContent open={open} onClose={onClose} onSuccess={onSuccess} agent={agent} /> : null}
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
}

export function DrawerContent({ open, onClose, onSuccess, agent }: UpdateAgentDrawerProps) {
    const [form, setForm] = useState<AgentForm>({
        email: "",
        display_name: "",
        password: "",
        entra_object_id: "",
        role: AgentRole.VIEWER
    });
    const [hasPassword, setHasPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!agent || !open) {
            return;
        }

        setError(null);
        setLoading(false);
        setHasPassword(agent.has_password);

        setForm({
            email: agent.email ?? "",
            display_name: agent.display_name ?? "",
            password: "",
            entra_object_id: agent.entra_object_id ?? "",
            role: agent.role ?? AgentRole.VIEWER
        });
    }, [agent, open]);

    function update<K extends keyof AgentForm>(key: K, value: AgentForm[K]) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    async function handleSubmit() {
        if (!agent) {
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const payload = {
                email: form.email,
                display_name: form.display_name,
                role: form.role,
                ...(form.password && { password: form.password }),
                ...(form.entra_object_id && { entra_object_id: form.entra_object_id })
            }

            const res = await fetch(`/api/agents/${agent.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            onSuccess();
        } catch (err: any) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    async function handleRemovePassword() {
        if (!agent) {
            return;
        }

        const prompt = confirm(`Are you sure you want to remove the password from ${agent.display_name}?`);

        if (!prompt) {
            return;
        }

        try {
            const res = await fetch(`/api/agents/${agent.id}/remove-password`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" }
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            setHasPassword(false);
            toaster.create({ title: "Password has been removed", type: "success" });

            onSuccess();
        } catch (err: any) {
            setError(err instanceof Error ? err.message : "Something went wrong removing password");
        } finally {
            setLoading(false);
        }
    }

    if (!agent) {
        return null;
    }

    return (
        <>
            <Drawer.Header>
                <Drawer.Title>Edit Agent</Drawer.Title>
            </Drawer.Header>

            <Drawer.Body>
                <VStack align="stretch" gap={4}>
                    {agent.deleted_at && (
                        <Box
                            bgColor="orange.200"
                            color="orange.700"
                            paddingY={2}
                            paddingX={4}
                            borderRadius="sm"
                        >
                            This agent is disabled.
                        </Box>
                    )}

                    <Field.Root>
                        <Field.Label>Email</Field.Label>
                        <Input
                            value={form.email}
                            onChange={e => update("email", e.target.value)}
                            placeholder="me@example.com"
                        />
                    </Field.Root>

                    <Field.Root>
                        <Field.Label>Display Name</Field.Label>
                        <Input
                            value={form.display_name}
                            onChange={e => update("display_name", e.target.value)}
                            placeholder="John Doe"
                        />
                    </Field.Root>

                    <Field.Root>
                        <Field.Label>Role</Field.Label>

                        <NativeSelect.Root>
                            <NativeSelect.Field
                                value={form.role}
                                onChange={e => update("role", e.target.value as AgentRole)}
                            >
                                <option value={AgentRole.VIEWER}>Viewer</option>
                                <option value={AgentRole.MANAGER}>Lead Technician</option>
                                <option value={AgentRole.ADMIN}>Admin</option>
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                        </NativeSelect.Root>
                    </Field.Root>

                    <Field.Root>
                        <Field.Label>New Password (optional)</Field.Label>
                        <Input
                            type="text"
                            value={form.password}
                            onChange={e => update("password", e.target.value)}
                            placeholder={hasPassword ? "Leave blank to keep existing" : "Type a password here or leave blank"}
                        />
                        <Field.HelperText
                            width="100%"
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                        >
                            Has Password: {hasPassword ? "Yes" : "No"}

                            {hasPassword && (
                                <Button
                                    size="xs"
                                    onClick={handleRemovePassword}
                                    height={6}
                                    colorPalette="red"
                                >
                                    Remove Password
                                </Button>
                            )}
                        </Field.HelperText>


                    </Field.Root>

                    <Field.Root>
                        <Field.Label>Entra Object ID (optional)</Field.Label>
                        <Input
                            value={form.entra_object_id}
                            onChange={e => update("entra_object_id", e.target.value)}
                            placeholder="UUID v4"
                        />
                    </Field.Root>

                    {error && (
                        <Text color="red.500" fontSize="sm">
                            {error}
                        </Text>
                    )}
                </VStack>
            </Drawer.Body>

            <Drawer.Footer>
                <Drawer.ActionTrigger asChild>
                    <Button
                        colorPalette="brand.dark"
                        variant="outline"
                        height={8}
                    >
                        Cancel
                    </Button>
                </Drawer.ActionTrigger>

                <Button onClick={handleSubmit} loading={loading} height={8}>
                    Save Changes
                </Button>
            </Drawer.Footer>

            <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" />
            </Drawer.CloseTrigger>
        </>
    );
}
