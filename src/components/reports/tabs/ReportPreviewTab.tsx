import { Agent, AgentRole } from "@/lib/entities/Agent";
import {
    Button,
    Flex,
    Spinner,
    Stack,
    Table,
    Text
} from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect } from "react";

interface Props {
    loadPreviewOrExecute: () => void;
    data?: { rows: any[] };
    loading?: boolean;
    error?: string | null;
    session: { agent: Agent };
    view?: boolean;
}

export function ReportPreviewTab({
    loadPreviewOrExecute,
    data,
    session,
    loading,
    error,
    view
}: Props) {
    const rows = data?.rows || [];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (view) {
            loadPreviewOrExecute();
        }
    }, []);

    return (
        <Stack gap={6}>
            <Flex gap={4}>
                <Button onClick={loadPreviewOrExecute} colorScheme="blue" width="fit-content">
                    {!view ? "Run Preview" : "Run Report"}
                </Button>

                {view && session?.agent?.role === AgentRole.ADMIN && (
                    <Button onClick={() => router.push(`${pathname}/edit`)} variant="outline">
                        Edit Report
                    </Button>
                )}
            </Flex>

            {loading && <Spinner />}

            {error && (
                <Text color="red.500">
                    {error}
                </Text>
            )}

            {!loading && rows.length > 0 && (
                <Table.Root variant="outline" size="sm">
                    <Table.Header>
                        <Table.Row>
                            {columns.map(col => (
                                <Table.ColumnHeader key={col}>
                                    {col}
                                </Table.ColumnHeader>
                            ))}
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        {rows.map((row, i) => (
                            <Table.Row key={i}>
                                {columns.map(col => (
                                    <Table.Cell key={col}>
                                        {String(row[col])}
                                    </Table.Cell>
                                ))}
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            )}

            {!loading && rows.length === 0 && !error && (
                <Text>No data returned</Text>
            )}
        </Stack>
    );
}