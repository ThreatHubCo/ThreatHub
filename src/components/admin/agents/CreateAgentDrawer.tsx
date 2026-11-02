
import { useConfig } from "@/lib/config/ConfigContext";
import { Session } from "@/lib/entities/Session";
import { Button, Checkbox, CloseButton, Drawer, Field, Input, Portal, Spinner, Stack, Text } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface CreateAgentDrawerProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateAgentDrawer({
    open,
    onClose,
    onSuccess
}: CreateAgentDrawerProps) {
    const [email, setEmail] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [password, setPassword] = useState("");
    const [entraObjectId, setEntraObjectId] = useState("");
    const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { data: session } = useSession() as Session;
    const config = useConfig();

    useEffect(() => {
        if (!open) return;

        async function fetchRoles() {
            try {
                setRolesLoading(true);

                const res = await fetch("/api/admin/roles");

                if (!res.ok) {
                    throw new Error("Failed to fetch available roles");
                }

                const data = await res.json();

                setRoles(data.filter(role => !role.is_default_role));

                setSelectedRoles(
                    data
                        .filter(role => role.is_default_role)
                        .map(role => role.id)
                );
            } catch (e: any) {
                setError(e.message ?? "Failed to fetch roles");
            } finally {
                setRolesLoading(false);
            }
        }

        fetchRoles();
    }, [open]);

    function toggleRole(roleId: number, checked: boolean) {
        setSelectedRoles(current =>
            checked ? [...current, roleId] : current.filter(id => id !== roleId)
        );
    }

    async function handleSubmit() {
        setError(null);

        try {
            setLoading(true);

            const res = await fetch("/api/admin/agents/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    display_name: displayName,
                    password: password || undefined,
                    entra_object_id: entraObjectId || undefined,
                    roles: selectedRoles
                })
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to create agent");
            }

            onSuccess();

            setEmail("");
            setDisplayName("");
            setPassword("");
            setEntraObjectId("");
            setSelectedRoles([]);
        } catch (e: any) {
            setError(e.message ?? "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Drawer.Root
            size="md"
            open={open}
            onOpenChange={() => onClose()}
        >
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.Header>
                            <Drawer.Title>Create Agent</Drawer.Title>
                        </Drawer.Header>

                        <Drawer.Body>
                            <Stack align="stretch" gap={4}>
                                <Field.Root>
                                    <Field.Label>Email</Field.Label>
                                    <Input
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="me@example.com"
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Display Name</Field.Label>
                                    <Input
                                        value={displayName}
                                        onChange={e => setDisplayName(e.target.value)}
                                        placeholder="John Doe"
                                    />
                                </Field.Root>

                                <Text fontWeight="semibold" marginBottom={-2}>Roles</Text>

                                {rolesLoading ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <Stack
                                        align="stretch"
                                        gap={3}
                                        borderWidth="1px"
                                        borderRadius="md"
                                        padding={3}
                                    >
                                        {roles.map(role => (
                                            <Checkbox.Root
                                                key={role.id}
                                                checked={selectedRoles.includes(role.id)}
                                                onCheckedChange={({ checked }) => toggleRole(role.id, checked === true)}
                                            >
                                                <Checkbox.HiddenInput />
                                                <Checkbox.Control />
                                                <Checkbox.Label>
                                                    <Stack align="start" gap={0}>
                                                        <Text fontWeight="medium">
                                                            {role.name}
                                                        </Text>
                                                        {role.summary && (
                                                            <Text fontSize="xs" color="fg.muted">
                                                                {role.summary}
                                                            </Text>
                                                        )}
                                                    </Stack>
                                                </Checkbox.Label>
                                            </Checkbox.Root>
                                        ))}
                                    </Stack>
                                )}

                                <Field.Root>
                                    <Field.Label>Password (optional)</Field.Label>
                                    <Input
                                        type="text"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Enter a password"
                                    />
                                    <Field.HelperText>
                                        {!Boolean(config.ENABLE_PASSWORD_AUTH) && (
                                            <Text color="red.600">
                                                Password authentication is disabled in the config so the user will not be able to sign in using this method.
                                            </Text>
                                        )}
                                    </Field.HelperText>
                                </Field.Root>

                                {error && (
                                    <Text color="red.500" fontSize="sm">
                                        {error}
                                    </Text>
                                )}
                            </Stack>
                        </Drawer.Body>

                        <Drawer.Footer>
                            <Drawer.ActionTrigger asChild>
                                <Button
                                    variant="outline"
                                    colorPalette="brand.dark"
                                    height={8}
                                >
                                    Cancel
                                </Button>
                            </Drawer.ActionTrigger>

                            <Button
                                onClick={handleSubmit}
                                loading={loading}
                                disabled={rolesLoading || selectedRoles.length === 0}
                                height={8}
                            >
                                Create Agent
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
