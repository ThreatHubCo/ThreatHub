import { Customer } from "@/lib/entities/Customer";
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
import { useEffect, useState } from "react";

interface CreateCustomerDrawerProps {
    open: boolean;
    onOpen: (open: boolean) => void;
    customer: Customer;
}

export function UpdateCustomerDrawer({ open, onOpen, customer }: CreateCustomerDrawerProps) {
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
                        {open ? <DrawerContent open={open} onOpen={onOpen} customer={customer} /> : null}
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
}

function DrawerContent({ open, onOpen, customer }: CreateCustomerDrawerProps) {
    const [name, setName] = useState("");
    const [tenantId, setTenantId] = useState("");
    const [supportsCsp, setSupportsCsp] = useState(false);
    const [externalCustomerId, setExternalCustomerId] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (customer) {
            setName(customer.name);
            setTenantId(customer.tenant_id ?? "");
            setSupportsCsp(customer.supports_csp);
            setExternalCustomerId(customer.external_customer_id ?? "");
        }
    }, [customer, open]);

    async function handleSubmit() {
        if (!customer) {
            return;
        }
        setError(null);

        try {
            setLoading(true);

            const payload: Record<string, any> = {
                name,
                supports_csp: Boolean(supportsCsp)
            }

            if (tenantId.trim() !== "") {
                payload.tenant_id = tenantId;
            }
            if (externalCustomerId.trim() !== "") {
                payload.external_customer_id = externalCustomerId;
            }

            const res = await fetch(`/api/customers/${customer.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to update customer");
            }

            onOpen(false);
        } catch (err: any) {
            setError(err.message ?? "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Drawer.Header>
                <Drawer.Title>Edit Customer</Drawer.Title>
            </Drawer.Header>

            <Drawer.Body>
                <VStack align="stretch" gap={6}>
                    {customer.deleted_at && (
                        <Box
                            bgColor="orange.200"
                            color="orange.700"
                            paddingY={2}
                            paddingX={4}
                            borderRadius="sm"
                        >
                            This customer is disabled. Vulnerability data will not be fetched.
                        </Box>
                    )}

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
        </>
    );
}
