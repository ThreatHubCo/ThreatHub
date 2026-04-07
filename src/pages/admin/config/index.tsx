import { AdminSection } from "@/components/admin/AdminSection";
import { Switch } from "@/components/ui/base/Switch";
import { toaster } from "@/components/ui/base/Toaster";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { NotAuthorisedPage } from "@/components/ui/NotAuthorisedPage";
import { Page } from "@/components/ui/Page";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { DEFAULT_CONFIG } from "@/lib/config/configDefaults";
import { AgentRole } from "@/lib/entities/Agent";
import { ConfigKey, TicketSystemType } from "@/lib/entities/Config";
import { Session } from "@/lib/entities/Session";
import { Button, Field, Heading, Input, NativeSelect, SimpleGrid, Stack } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type ConfigForm = Partial<Record<ConfigKey, string | boolean | number>>;

const EMPTY_FORM: ConfigForm = Object.fromEntries(
    Object.entries(DEFAULT_CONFIG).map(([key, config]) => [
        key as ConfigKey,
        config.value
    ])
);

export default function Admin({ sidebarCollapsed }) {
    const [form, setForm] = useState<ConfigForm>(EMPTY_FORM);
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [error, setError] = useState("");

    const { data: session, status: sessionStatus } = useSession() as Session;
    const router = useRouter();

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchConfig();
        }
    }, [sessionStatus]);

    function update(key: ConfigKey, value: string | boolean | number) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    async function fetchConfig() {
        setLoadingConfig(true);
        try {
            const res = await fetch("/api/admin/config");

            if (res.ok) {
                const config = await res.json();
                setForm(config);
            }
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoadingConfig(false);
        }
    }

    async function saveConfig() {
        setError(null);

        try {
            const res = await fetch("/api/admin/config", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const body = await res.json();
                throw new Error(body?.error || "Failed to save config");
            }

            fetchConfig();
            toaster.create({ type: "success", title: "Config has been updated" });
        } catch (e: any) {
            console.error(e);
            setError(e.message);
        }
    }


    if (sessionStatus === "loading" || !router.isReady) {
        return <SkeletonPage />
    }

    if (!session) {
        router.push("/login");
        return false;
    }

    if (session?.agent?.role !== AgentRole.ADMIN) {
        return <NotAuthorisedPage />
    }

    if (error) {
        return <ErrorPage error={error} />
    }

    return (
        <Page
            title="Administration"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Heading size="3xl" marginBottom={4}>Administration</Heading>

            <Stack gap={4}>
                <AdminSection title="Ticket System">
                    <Field.Root marginBottom={6}>
                        <Field.Label>Enable Ticketing</Field.Label>
                        <Switch
                            checked={form.ENABLE_TICKETING as boolean ?? false}
                            onCheckedChange={(e) =>
                                update(ConfigKey.ENABLE_TICKETING, e.checked)
                            }
                        />
                        <Field.HelperText>
                            Enable support for creating tickets
                        </Field.HelperText>
                    </Field.Root>

                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                        <Field.Root>
                            <Field.Label>Platform</Field.Label>
                            <NativeSelect.Root>
                                <NativeSelect.Field
                                    value={form.TICKET_SYSTEM_TYPE as TicketSystemType | null ?? TicketSystemType.NONE}
                                    onChange={(e) =>
                                        update(ConfigKey.TICKET_SYSTEM_TYPE, e.target.value)
                                    }
                                >
                                    <option value={TicketSystemType.NONE}>None</option>
                                    <option value={TicketSystemType.HALO_PSA}>Halo PSA</option>
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                            <Field.HelperText>
                                Choose which ticket system you're connecting to (e.g. Halo PSA)
                            </Field.HelperText>
                        </Field.Root>

                        <Field.Root>
                            <Field.Label>URL</Field.Label>
                            <Input
                                value={form.TICKET_SYSTEM_URL as string | null ?? ""}
                                onChange={(e) =>
                                    update(ConfigKey.TICKET_SYSTEM_URL, e.target.value)
                                }
                                placeholder="https://example.halopsa.com"
                            />
                            <Field.HelperText>
                                The URL of your ticket system
                            </Field.HelperText>
                        </Field.Root>

                        <Field.Root>
                            <Field.Label>Client ID</Field.Label>
                            <Input
                                value={form.TICKET_SYSTEM_CLIENT_ID as string | null ?? ""}
                                onChange={(e) =>
                                    update(ConfigKey.TICKET_SYSTEM_CLIENT_ID, e.target.value)
                                }
                            />
                            <Field.HelperText>
                                The Client ID for the OAuth app
                            </Field.HelperText>
                        </Field.Root>

                        <Field.Root>
                            <Field.Label>Client Secret</Field.Label>
                            <Input
                                value={form.TICKET_SYSTEM_CLIENT_SECRET as string | null ?? ""}
                                onChange={(e) =>
                                    update(ConfigKey.TICKET_SYSTEM_CLIENT_SECRET, e.target.value)
                                }
                            />
                            <Field.HelperText>
                                The Client Secret for the OAuth app
                            </Field.HelperText>
                        </Field.Root>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} marginTop={6}>
                        <Field.Root>
                            <Field.Label>Minimum CVE Severity for Escalation</Field.Label>
                            <NativeSelect.Root>
                                <NativeSelect.Field
                                    value={form.MIN_CVE_SEVERITY_FOR_ESCALATION as string | null ?? ""}
                                    onChange={(e) =>
                                        update(ConfigKey.MIN_CVE_SEVERITY_FOR_ESCALATION, e.target.value)
                                    }
                                >
                                    <option value="Critical">Critical</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                            <Field.HelperText>
                                Tickets will only be automatically created for software where the highest severity CVE is equal to or greater than the value provided here.
                            </Field.HelperText>
                        </Field.Root>

                        {/* <Field.Root>
                            <Field.Label>Minimum Time Before Escalation</Field.Label>
                            <Input
                                value={form.WAIT_TIME_BEFORE_ESCALATION as string | null ?? ""}
                                onChange={(e) => {
                                    const sanitized = e.target.value.replace(/\D/g, "");
                                    update(ConfigKey.WAIT_TIME_BEFORE_ESCALATION, Number(sanitized ?? 0))
                                }}
                                type="text"
                                inputMode="numeric" 
                                pattern="\d*" 
                            />
                            <Field.HelperText>
                              
                            </Field.HelperText>
                        </Field.Root> */}

                        <Field.Root>
                            <Field.Label>Escalate Public Exploit Immediately</Field.Label>
                            <Switch
                                checked={form.ESCALATE_PUBLIC_EXPLOIT_IMMEDIATELY as boolean ?? false}
                                onCheckedChange={(e) =>
                                    update(ConfigKey.ESCALATE_PUBLIC_EXPLOIT_IMMEDIATELY, e.checked)
                                }
                            />
                            <Field.HelperText>
                                
                            </Field.HelperText>
                        </Field.Root>

                    </SimpleGrid>

                    <Button
                        onClick={saveConfig}
                        marginTop={4}
                        size="xs"
                    >
                        Save Changes
                    </Button>
                </AdminSection>

                <AdminSection title="Microsoft Details">
                    <Stack gap={4}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                            <Field.Root marginBottom={6}>
                                <Field.Label>Enable Microsoft Authentication</Field.Label>
                                <Switch
                                    checked={form.ENABLE_MICROSOFT_AUTH as boolean ?? false}
                                    onCheckedChange={(e) =>
                                        update(ConfigKey.ENABLE_MICROSOFT_AUTH, e.checked)
                                    }
                                />
                                <Field.HelperText>
                                    Enable support for signing in with a Microsoft account
                                </Field.HelperText>
                            </Field.Root>

                            <Field.Root>
                                <Field.Label>Home Tenant ID</Field.Label>
                                <Input
                                    value={form.HOME_TENANT_ID as string | null ?? ""}
                                    onChange={(e) =>
                                        update(ConfigKey.HOME_TENANT_ID, e.target.value)
                                    }
                                />
                                <Field.HelperText>
                                    The ID of your home tenant
                                </Field.HelperText>
                            </Field.Root>
                        </SimpleGrid>

                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                            <Field.Root>
                                <Field.Label>Entra Client ID (Auth App)</Field.Label>
                                <Input
                                    value={form.ENTRA_AUTH_CLIENT_ID as string | null ?? ""}
                                    onChange={(e) =>
                                        update(ConfigKey.ENTRA_AUTH_CLIENT_ID, e.target.value)
                                    }
                                />
                                <Field.HelperText>
                                    The Client ID for the OAuth app used for authentication
                                </Field.HelperText>
                            </Field.Root>

                            <Field.Root>
                                <Field.Label>Entra Client Secret (Auth App)</Field.Label>
                                <Input
                                    value={form.ENTRA_AUTH_CLIENT_SECRET as string | null ?? ""}
                                    onChange={(e) =>
                                        update(ConfigKey.ENTRA_AUTH_CLIENT_SECRET, e.target.value)
                                    }
                                />
                                <Field.HelperText>
                                    The Client Secret for the OAuth app used for authentication
                                </Field.HelperText>
                            </Field.Root>
                        </SimpleGrid>

                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                            <Field.Root required>
                                <Field.Label>
                                    Entra Client ID (Defender API)
                                    <Field.RequiredIndicator />
                                </Field.Label>
                                <Input
                                    value={form.ENTRA_BACKEND_CLIENT_ID as string | null ?? ""}
                                    onChange={(e) =>
                                        update(ConfigKey.ENTRA_BACKEND_CLIENT_ID, e.target.value)
                                    }
                                />
                                <Field.HelperText>
                                    The Client ID for the OAuth app used to access the Defender API
                                </Field.HelperText>
                            </Field.Root>

                            <Field.Root required>
                                <Field.Label>
                                    Entra Client Secret (Defender API)
                                    <Field.RequiredIndicator />
                                </Field.Label>
                                <Input
                                    value={form.ENTRA_BACKEND_CLIENT_SECRET as string | null ?? ""}
                                    onChange={(e) =>
                                        update(ConfigKey.ENTRA_BACKEND_CLIENT_SECRET, e.target.value)
                                    }
                                />
                                <Field.HelperText>
                                    The Client Secret for the OAuth app used to access the Defender API
                                </Field.HelperText>
                            </Field.Root>
                        </SimpleGrid>
                    </Stack>

                    <Button
                        onClick={saveConfig}
                        marginTop={4}
                        size="xs"
                    >
                        Save Changes
                    </Button>
                </AdminSection>

                <AdminSection title="Miscellaneous">
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                        <Field.Root>
                            <Field.Label>Enable Password Authentication</Field.Label>
                            <Switch
                                checked={form.ENABLE_PASSWORD_AUTH as boolean ?? false}
                                onCheckedChange={(e) =>
                                    update(ConfigKey.ENABLE_PASSWORD_AUTH, e.checked)
                                }
                            />
                            <Field.HelperText>
                                Enable support for signing in with an email and password
                            </Field.HelperText>
                        </Field.Root>

                        <Field.Root>
                            <Field.Label>Site URL</Field.Label>
                            <Input
                                value={form.SITE_URL as string | null ?? ""}
                                onChange={(e) =>
                                    update(ConfigKey.SITE_URL, e.target.value)
                                }
                                placeholder="https://threathub.mycompany.com"
                            />
                            <Field.HelperText>
                                The URL of this site, e.g. https://threathub.mycompany.com. This is used for direct links in tickets.
                            </Field.HelperText>
                        </Field.Root>
                    </SimpleGrid>

                    <Button
                        onClick={saveConfig}
                        marginTop={4}
                        size="xs"
                    >
                        Save Changes
                    </Button>
                </AdminSection>

                <AdminSection title="External Reporting">
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                         {/* <Field.Root>
                            <Field.Label>Enable Heartbeat Forwarding</Field.Label>
                            <Switch
                                checked={form.SEND_EXTERNAL_HEARTBEAT as boolean ?? false}
                                onCheckedChange={(e) =>
                                    update(ConfigKey.SEND_EXTERNAL_HEARTBEAT, e.checked)
                                }
                            />
                            <Field.HelperText>
                                Enable this to send heartbeats from Ingestor to the ThreatHub team. This is useful for the team to receive notifications if there is a fault.
                            </Field.HelperText>
                        </Field.Root> */}

                        <Field.Root>
                            <Field.Label>Instance ID</Field.Label>
                            <Input
                                value={form.INSTANCE_ID as string | null ?? ""}
                                onChange={(e) =>
                                    update(ConfigKey.INSTANCE_ID, e.target.value)
                                }
                                disabled
                            />
                            <Field.HelperText>
                                The unique ID for this instance of ThreatHub.
                            </Field.HelperText>
                        </Field.Root>
                    </SimpleGrid>

                    {/* <Button
                        onClick={saveConfig}
                        marginTop={4}
                        size="xs"
                    >
                        Save Changes
                    </Button> */}
                </AdminSection>
            </Stack>
        </Page>
    )
}