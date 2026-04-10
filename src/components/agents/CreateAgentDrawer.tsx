import { AgentRole } from "@/lib/entities/Agent";
import { Session } from "@/lib/entities/Session";
import {
    Button,
    CloseButton,
    Drawer,
    Portal,
    Field,
    Input,
    VStack,
    Text,
    NativeSelect
} from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useState } from "react";

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
    const [role, setRole] = useState(AgentRole.VIEWER);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { data: session, status: sessionStatus } = useSession() as Session;

    async function handleSubmit() {
        setError(null);

        try {
            setLoading(true);

            const res = await fetch("/api/agents/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    display_name: displayName,
                    password: password || undefined,
                    entra_object_id: entraObjectId || undefined,
                    role
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
            setRole(AgentRole.VIEWER);
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
            onOpenChange={({ open }) => onClose()}
        >
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.Header>
                            <Drawer.Title>Create Agent</Drawer.Title>
                        </Drawer.Header>

                        <Drawer.Body>
                            <VStack align="stretch" gap={4}>

                                <Field.Root>
                                    <Field.Label>Email</Field.Label>
                                    <Input
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="me@example.com"
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Display Name</Field.Label>
                                    <Input
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="John Doe"
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Role</Field.Label>

                                    <NativeSelect.Root>
                                        <NativeSelect.Field
                                            value={role}
                                            onChange={(e) => setRole(e.target.value as AgentRole)}
                                        >
                                            <option value={AgentRole.VIEWER}>Viewer</option>
                                            {session?.agent?.role === AgentRole.ADMIN && (
                                                <>
                                                    <option value={AgentRole.MANAGER}>Lead Technician</option>
                                                    <option value={AgentRole.ADMIN}>Admin</option>
                                                </>
                                            )}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Password (optional)</Field.Label>
                                    <Input
                                        type="text"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter a password"
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Entra Object ID (optional)</Field.Label>
                                    <Input
                                        value={entraObjectId}
                                        onChange={(e) => setEntraObjectId(e.target.value)}
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
                                    variant="outline"
                                    colorPalette="brand.dark"
                                    height={8}
                                >
                                    Cancel
                                </Button>
                            </Drawer.ActionTrigger>

                            <Button onClick={handleSubmit} loading={loading} height={8}>
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
