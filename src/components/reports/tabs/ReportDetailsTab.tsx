import { DateTextWithHover } from "@/components/ui/DateTextWithHover";
import { AgentPermission, hasPermission } from "@/lib/agents/permissions";
import { ServerSession } from "@/lib/entities/Session";
import { ReportForm } from "@/pages/reports/create";
import { Field, Flex, Input, Stack, Switch, Text, Textarea } from "@chakra-ui/react";

interface Props {
    report?: any;
    form: ReportForm;
    update: <K extends keyof ReportForm>(key: K, value: ReportForm[K]) => void;
    session: ServerSession;
}

export function ReportDetailsTab({ report, form, update, session }: Props) {
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

            <Switch.Root
                checked={form.is_public}
                onCheckedChange={(e) => update("is_public", Boolean(e.checked))}
                disabled={!hasPermission(session, AgentPermission.REPORT_EDIT)}
            >
                <Switch.HiddenInput />
                <Switch.Control />
                <Switch.Label>Public</Switch.Label>
            </Switch.Root>

            {report && (
                <Flex fontSize="14px" gap="5px">
                    <Text lineHeight="1.3">Created by {report.created_by_agent_name} on</Text> <DateTextWithHover date={report.created_at} withTime />
                </Flex>
            )}
        </Stack>
    )
}