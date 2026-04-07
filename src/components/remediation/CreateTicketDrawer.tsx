import { useConfig } from "@/lib/config/ConfigContext";
import { Customer } from "@/lib/entities/Customer";
import { Device } from "@/lib/entities/Device";
import { Software } from "@/lib/entities/Software";
import { Vulnerability } from "@/lib/entities/Vulnerability";
import { findSoftwareInfo } from "@/lib/utils/softwareMap";
import {
    Button,
    CloseButton,
    Drawer,
    Field,
    Flex,
    Input,
    NativeSelect,
    Portal,
    Text,
    Textarea,
    VStack
} from "@chakra-ui/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LuCheck } from "react-icons/lu";
import { toaster } from "../ui/base/Toaster";

interface Props {
    open: boolean;
    onOpen: (open: boolean) => void;
    software?: Software;
    vulnerabilities?: Vulnerability[];
    devices?: Device[];
    customer?: Partial<Customer>;
}

export function CreateTicketDrawer({
    open,
    onOpen,
    software,
    vulnerabilities,
    devices,
    customer
}: Props) {
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [externalTicketId, setExternalTicketId] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customers, setCustomers] = useState([]);

    const config = useConfig();

    useEffect(() => {
        setExternalTicketId("");
        setSelectedCustomer(customer ?? null);
        fetchCustomers();
    }, [open]);

    useEffect(() => {
        if (software) {
            setExternalTicketId("");
            setSubject(`${selectedCustomer?.name} - ${findSoftwareInfo(software).name}`);
            setDescription(`Please can the vulnerabilities for this software be looked into`);
        } else {
            setExternalTicketId("");
            setSubject("");
            setDescription("");
        }
    }, [selectedCustomer]);

    async function fetchCustomers() {
        try {
            const res = await fetch("/api/customers?enabled=true&pageSize=100", {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to fetch customers");
            }

            const data = await res.json();

            setCustomers(data.customers);
        } catch (e: any) {
            toaster.create({ title: "Failed to fetch customers", description: e.message, type: "error" });
        }
    }

    async function handleSubmit() {
        setError(null);

        try {
            setLoading(true);

            const res = await fetch("/api/tickets/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject,
                    description,
                    customerId: customer.id,
                    softwareId: software.id
                })
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to create ticket");
            }

            const data = await res.json();

            setExternalTicketId(data.externalTicketId);
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
                            <Drawer.Title>Create Ticket</Drawer.Title>
                        </Drawer.Header>

                        <Drawer.Body>
                            <Flex gap={1} flexDirection="column" marginBottom={6}>
                                <Text lineHeight="1.9" fontWeight="500">Customer</Text>
                                <NativeSelect.Root>
                                    <NativeSelect.Field
                                        height={8}
                                        bgColor="white"
                                        color="black"
                                        border="1px solid"
                                        borderColor="gray.400"
                                        _hover={{
                                            bgColor: "blue.100"
                                        }}
                                        value={selectedCustomer?.id ?? ""}
                                        onChange={(e) => {
                                            const customer = customers.filter(c => String(c.id) === e.target.value);
                                            if (customer.length === 1) {
                                                setSelectedCustomer(customer[0]);
                                            }
                                        }}
                                    >
                                        <option value="">Please select a customer</option>
                                        {customers.map(customer => {
                                            if (!customer.deleted_at) {
                                                return <option key={customer.id} value={customer.id}>{customer.name}</option>
                                            }
                                        })}
                                    </NativeSelect.Field>
                                    <NativeSelect.Indicator />
                                </NativeSelect.Root>
                            </Flex>

                            {externalTicketId && (
                                <Flex
                                    bgColor="green"
                                    color="white"
                                    alignItems="center"
                                    paddingY={1}
                                    paddingX={2}
                                    gap={2}
                                    marginBottom={4}
                                >
                                    <LuCheck />
                                    {/* TODO: Make URL work for other ticket systems */}
                                    <Text>
                                        Ticket created:&nbsp;
                                        <Link
                                            style={{ textDecoration: "underline" }}
                                            target="_blank"
                                            href={`${config.TICKET_SYSTEM_URL}/ticket?id=${externalTicketId}`}
                                        >
                                            {externalTicketId}
                                        </Link>
                                    </Text>
                                </Flex>
                            )}

                            {selectedCustomer && (
                                <VStack align="stretch" gap={4}>
                                    <Field.Root>
                                        <Field.Label>Subject</Field.Label>
                                        <Input
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Description</Field.Label>
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={4}
                                        />
                                    </Field.Root>

                                    {error && (
                                        <Text color="red.500" fontSize="sm">
                                            {error}
                                        </Text>
                                    )}
                                </VStack>
                            )}
                        </Drawer.Body>

                        <Drawer.Footer>
                            {selectedCustomer && <Text color="gray.500" marginRight="auto">Creating ticket for {selectedCustomer.name}</Text>}

                            <Drawer.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                            </Drawer.ActionTrigger>

                            <Button
                                onClick={handleSubmit}
                                loading={loading}
                                disabled={!subject || !description || !selectedCustomer}
                            >
                                Create
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
