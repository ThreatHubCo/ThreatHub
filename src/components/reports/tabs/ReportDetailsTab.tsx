import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { AgentPermission, hasPermission } from "@/lib/agents/permissions";
import { ServerSession } from "@/lib/entities/Session";
import { ReportForm } from "@/pages/reports/create";
import { createListCollection, Field, Flex, Input, Select, Stack, Switch, Text, Textarea } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface Category {
    id: number;
    name: string;
    description: string | null;
}

interface Props {
    report?: any;
    form: ReportForm;
    update: <K extends keyof ReportForm>(key: K, value: ReportForm[K]) => void;
    session: ServerSession;
}

export function ReportDetailsTab({ report, form, update, session }: Props) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    useEffect(() => {
        async function fetchCategories() {
            try {
                const response = await fetch("/api/reports/categories");

                if (!response.ok) {
                    throw new Error("Failed to fetch report categories");
                }

                const data = await response.json();
                setCategories(data);
            } catch (error) {
                console.error("Failed to fetch report categories:", error);
            } finally {
                setLoadingCategories(false);
            }
        }

        fetchCategories();
    }, []);

    const categoryCollection = createListCollection({
        items: [
            { label: "No category", value: "none", description: undefined },
            ...categories.map(category => ({
                label: category.name,
                value: String(category.id),
                description: category.description
            }))
        ]
    });

    return (
        <Stack gap={8}>
            <Field.Root>
                <Field.Label>Name</Field.Label>
                <Input
                    value={form.name}
                    onChange={e => update("name", e.target.value)}
                    placeholder="My Cool Report"
                    disabled={!hasPermission(session, AgentPermission.REPORT_EDIT)}
                />
            </Field.Root>

            <Field.Root>
                <Field.Label>Description</Field.Label>
                <Textarea
                    value={form.description}
                    onChange={e => update("description", e.target.value)}
                    rows={4}
                    disabled={!hasPermission(session, AgentPermission.REPORT_EDIT)}
                />
            </Field.Root>

            <Field.Root>
                <Field.Label>Category</Field.Label>
                <Select.Root
                    collection={categoryCollection}
                    value={form.category_id === -1 ? ["none"] : form.category_id == null ? ["none"] : [String(form.category_id)]}
                    onValueChange={e => update(
                        "category_id",
                        e.value[0] === "none" || !e.value[0] ? -1 : Number(e.value[0])
                    )}
                    disabled={!hasPermission(session, AgentPermission.REPORT_EDIT) || loadingCategories}
                >
                    <Select.HiddenSelect />
                    <Select.Control>
                        <Select.Trigger>
                            <Select.ValueText placeholder={loadingCategories ? "Loading categories..." : "Select a category (optional)"} />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                            <Select.Indicator />
                        </Select.IndicatorGroup>
                    </Select.Control>
                    <Select.Positioner>
                        <Select.Content>
                            {categoryCollection.items.map((category, index) => (
                                <Select.Item
                                    key={category.value}
                                    item={category}
                                    borderBottom={index !== categoryCollection.items.length - 1 ? "1px solid" : "none"}
                                    borderColor="gray.200"
                                >
                                    <Stack gap={0}>
                                        <Select.ItemText>{category.label}</Select.ItemText>
                                        {category.description && (
                                            <Text fontSize="xs" color="fg.muted">
                                                {category.description}
                                            </Text>
                                        )}
                                    </Stack>
                                    <Select.ItemIndicator />
                                </Select.Item>
                            ))}
                        </Select.Content>
                    </Select.Positioner>
                </Select.Root>
            </Field.Root>

            <Switch.Root
                checked={form.is_public}
                onCheckedChange={e => update("is_public", Boolean(e.checked))}
                disabled={!hasPermission(session, AgentPermission.REPORT_EDIT)}
            >
                <Switch.HiddenInput />
                <Switch.Control />
                <Switch.Label>Public</Switch.Label>
            </Switch.Root>

            {report && (
                <Flex fontSize="14px" gap="5px">
                    <Text lineHeight="1.3">Created by {report.created_by_agent_name} on</Text>
                    <DateTextWithHover date={report.created_at} withTime />
                </Flex>
            )}
        </Stack>
    );
}