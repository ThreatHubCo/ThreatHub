import { ReportForm } from "@/pages/reports/create";
import { Box, Link, Stack, Text } from "@chakra-ui/react";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-sql";
import Editor from "react-simple-code-editor";
import "prismjs/themes/prism.css";

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
            <Editor
                value={form.sql_query}
                onValueChange={code => update("sql_query", code)}
                highlight={code => highlight(code, languages.sql)}
                style={{
                    height: "90%",
                    border: "1px solid #ececec",
                    borderRadius: "6px"
                }}
                placeholder="Enter SQL here"
                padding="20px"
            />
        </Box>
    )
}