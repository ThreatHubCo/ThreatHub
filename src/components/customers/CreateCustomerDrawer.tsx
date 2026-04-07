import {
    Button,
    CloseButton,
    Drawer,
    Portal,
    Field,
    Input,
    VStack,
    Text,
    Switch,
    Box
} from "@chakra-ui/react";
import { useState } from "react";

interface CreateCustomerDrawerProps {
    open: boolean;
    onOpen: (open: boolean) => void;
}

export function CreateCustomerDrawer({ open, onOpen }: CreateCustomerDrawerProps) {
    const [name, setName] = useState("");
    const [tenantId, setTenantId] = useState("");
    const [externalCustomerId, setExternalCustomerId] = useState("");
    const [supportsCsp, setSupportsCsp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        setError(null);

        try {
            setLoading(true);

            const res = await fetch("/api/customers/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    tenant_id: tenantId || undefined,
                    supports_csp: supportsCsp,
                    external_customer_id: externalCustomerId || undefined
                })
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to create customer");
            }

            onOpen(false);

            setName("");
            setTenantId("");
            setSupportsCsp(false);
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
            onOpenChange={({ open }) => onOpen(open)}
        >
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.Header>
                            <Drawer.Title>Create Customer</Drawer.Title>
                        </Drawer.Header>

                        <Drawer.Body>
                            <VStack align="stretch" gap={6}>

                                <Field.Root>
                                    <Field.Label>Name</Field.Label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Test Client"
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Microsoft Tenant ID (optional)</Field.Label>
                                    <Input
                                        value={tenantId}
                                        onChange={(e) => setTenantId(e.target.value)}
                                    />
                                    <Field.HelperText>
                                        This is required for vulnerability data to be fetched from the Defender API.
                                    </Field.HelperText>
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>External Customer ID (optional)</Field.Label>
                                    <Input
                                        value={externalCustomerId}
                                        onChange={(e) => setExternalCustomerId(e.target.value)}
                                    />
                                    <Field.HelperText>
                                        The ID of the customer in your ticket system. This is used for automatically linking tickets to a customer.
                                    </Field.HelperText>
                                </Field.Root>

                                <Box>
                                    <Switch.Root
                                        checked={supportsCsp}
                                        onCheckedChange={(e) => setSupportsCsp(e.checked)}
                                    >
                                        <Switch.HiddenInput />
                                        <Switch.Control />
                                        <Switch.Label>Supports CSP?</Switch.Label>
                                    </Switch.Root>

                                    <Text marginTop={2} fontSize="12px" color="gray.600" lineHeight={1.4}>
                                        If the customer supports accessing their tenant via the Microsoft Partner Portal / Lighthouse. If this is enabled then Defender links will open directly in the tenant, otherwise the link will be copied to clipboard.
                                    </Text>
                                </Box>

                                {error && (
                                    <Text color="red.500" fontSize="sm">
                                        {error}
                                    </Text>
                                )}
                            </VStack>
                        </Drawer.Body>

                        <Drawer.Footer>
                            <Drawer.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                            </Drawer.ActionTrigger>

                            <Button onClick={handleSubmit} loading={loading}>
                                Save
                            </Button>
                        </Drawer.Footer>

                        <Drawer.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Drawer.CloseTrigger>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root >
    );
}
