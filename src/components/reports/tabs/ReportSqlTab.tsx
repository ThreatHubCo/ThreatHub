import { ReportForm } from "@/pages/reports/create";
import { Box, Link, Text } from "@chakra-ui/react";
import Editor from "@monaco-editor/react";

interface Props {
    form: ReportForm;
    update: <K extends keyof ReportForm>(key: K, value: ReportForm[K]) => void;
}

export function ReportSqlTab({ form, update }: Props) {
    return (
        <Box height="100%">
            <Text marginBottom={4}>
                A rough schema is available to download <Link href="/report-sql-schema.txt" color="blue.600" target="_blank">here</Link>. This will be improved in the future.
            </Text>

            <Box height="90%" border="1px solid" borderColor="#ececec" borderRadius="6px" overflow="hidden">
                <Editor
                    height="100%"
                    language="sql"
                    value={form.sql_query}
                    onChange={(value) => update("sql_query", value ?? "")}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4,
                        wordWrap: "on",
                        formatOnPaste: true
                    }}
                    loading={<Text padding={4}>Loading SQL editor...</Text>}
                />
            </Box>
        </Box>
    );
}