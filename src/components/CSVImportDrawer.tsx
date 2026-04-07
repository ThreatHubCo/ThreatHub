import {
    Button,
    CloseButton,
    Drawer,
    Portal,
    Field,
    Input,
    VStack,
    Text,
    Table
} from "@chakra-ui/react";
import { useRef } from "react";
import { useCsvImport } from "@/lib/hooks/useCsvImport";

interface CSVImportDrawerProps<T> {
    open: boolean;
    onOpen: (open: boolean) => void;
    title: string;
    headers: readonly (keyof T)[];
    endpoint: string;
    mapRow?: (row: Record<string, string>) => T;
}

export function CSVImportDrawer<T>({
    open,
    onOpen,
    title,
    headers,
    endpoint,
    mapRow
}: CSVImportDrawerProps<T>) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        rows,
        error,
        loading,
        downloadTemplate,
        handleFileSelect,
        submit
    } = useCsvImport<T>({
        headers,
        endpoint,
        mapRow,
        setOpen: onOpen
    });

    return (
        <Drawer.Root
            size="xl"
            open={open}
            onOpenChange={({ open }) => onOpen(open)}
        >
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.Header>
                            <Drawer.Title>{title}</Drawer.Title>
                        </Drawer.Header>

                        <Drawer.Body>
                            <VStack align="stretch" gap={4}>

                                <Button
                                    variant="outline"
                                    onClick={downloadTemplate}
                                >
                                    Download CSV Template
                                </Button>

                                <Field.Root>
                                    <Field.Label>Upload CSV</Field.Label>
                                    <Input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            
                                            if (file) {
                                                handleFileSelect(file);
                                            }
                                        }}
                                    />
                                </Field.Root>

                                {rows.length > 0 && (
                                    <>
                                        <Text fontSize="sm" color="green.600">
                                            {rows.length} rows ready to import
                                        </Text>

                                        <Table.Root size="sm" variant="outline">
                                            <Table.ScrollArea maxH="300px">
                                                    <Table.Header position="sticky" top={0} bg="gray.50" zIndex={1}>
                                                        <Table.Row>
                                                            {headers.map((header) => (
                                                                <Table.ColumnHeader key={String(header)}>
                                                                    {String(header)}
                                                                </Table.ColumnHeader>
                                                            ))}
                                                        </Table.Row>
                                                    </Table.Header>

                                                    <Table.Body>
                                                        {rows.slice(0, 20).map((row, i) => (
                                                            <Table.Row key={i}>
                                                                {headers.map((header) => (
                                                                    <Table.Cell key={String(header)}>
                                                                        {String((row as any)[header] ?? "")}
                                                                    </Table.Cell>
                                                                ))}
                                                            </Table.Row>
                                                        ))}
                                                    </Table.Body>
                                            </Table.ScrollArea>
                                        </Table.Root>
                                    </>
                                )}

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

                            <Button
                                onClick={submit}
                                loading={loading}
                                disabled={!rows.length}
                            >
                                Import
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