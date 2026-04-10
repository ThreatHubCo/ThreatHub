import { Box, Button, Drawer, Field, Flex, HStack, Input, Portal, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import Router from "next/router";
import React, { useEffect, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuCode, LuFileSpreadsheet } from "react-icons/lu";
import * as XLSX from "xlsx";
import { Checkbox } from "../ui/base/Checkbox";
import { toaster } from "../ui/base/Toaster";

export interface ExportDataColumn {
    name: string;
    key: string;
    shown?: boolean;
    boolean?: boolean;
    value?: ({ value, data }: { value?: string, data?: any }) => string;
}

interface Props {
    open: boolean;
    onClose: any;
    columns: ExportDataColumn[];
    dataUrl?: string;
    outputFileName: string;
    getDataArray: (json: any) => any[];
    fetchDataFn?: () => Promise<any[]>;
}

interface PageProps {
    data: any;
    columnData: ExportDataColumn[];
    outputName: string;
    onBack: () => void;
}

function ExportTableDrawer({ open, onClose, outputFileName: defaultOutputName, columns: columnData, dataUrl, getDataArray, fetchDataFn }: Props) {
    const [outputName, setOutputName] = useState(defaultOutputName);
    const [data, setData] = useState<any>();

    const [fileType, setFileType] = useState<"json" | "xlsx" | "">("");

    useEffect(() => {
        if (!open) {
            setFileType("");
            setOutputName(defaultOutputName);
        }
    }, [open, defaultOutputName]);

    useEffect(() => {
        if (!open) return;

        fetchData();
    }, [open]);

    const fetchData = async () => {
        try {
            let dataArray: any[] = [];

            if (fetchDataFn) {
                dataArray = await fetchDataFn();
            } else if (dataUrl) {
                const res = await fetch(dataUrl, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) throw new Error(await res.text());

                const json = await res.json();

                if (!getDataArray) throw new Error("getDataArray must be provided when using dataUrl");

                dataArray = getDataArray(json);
            } else {
                throw new Error("Either fetchDataFn or dataUrl must be provided");
            }

            const findInColumnData = (key: string) => columnData.find(col => col.key === key) || null;

            for (const item of dataArray) {
                for (const key of Object.keys(item)) {
                    const column = findInColumnData(key);
                    const value = item[key];

                    if (!column) {
                        delete item[key];
                        continue;
                    }

                    if (column.value) {
                        item[key] = column.value({ value, data: dataArray });
                    }
                }
            }

            setData(dataArray);
        } catch (e: any) {
            toaster.create({ title: e.message, type: "error" });
        }
    }

    /**
     * Handles closing the modal.
     * 
     * @param edited true if edited, otherwise false
     */
    const handleClose = (edited?: boolean) => {
        if (edited) {
            Router.reload();
        }
        onClose();
    }

    function ModalContent() {
        if (!fileType) {
            return (
                <Stack gap="2">
                    <CardButton
                        icon={<LuFileSpreadsheet />}
                        text="Excel Spreadsheet"
                        onClick={() => setFileType("xlsx")}
                    />
                    <CardButton
                        icon={<LuCode />}
                        text="JSON"
                        onClick={() => setFileType("json")}
                    />
                </Stack>
            );
        }
        if (fileType === "xlsx") {
            return (
                <SpreadsheetPage
                    data={data}
                    columnData={columnData}
                    outputName={outputName}
                    onBack={() => setFileType("")}
                />
            );
        }
        if (fileType === "json") {
            return (
                <JsonPage
                    data={data}
                    columnData={columnData}
                    outputName={outputName}
                    onBack={() => setFileType("")}
                />
            );
        }
        return <Text>Invalid selection</Text>
    }

    function getTitle() {
        if (!fileType) return "Choose file type to export to";
        if (fileType === "xlsx") return "Export to spreadsheet";
        if (fileType === "json") return "Export to JSON";
        return "Export";
    }

    return (
        <Drawer.Root
            size="md"
            open={open}
            onOpenChange={({ open }) => handleClose()}
        >
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.Header>
                            <Drawer.Title>{getTitle()}</Drawer.Title>
                        </Drawer.Header>
                        <Drawer.Body>
                            <ModalContent />
                        </Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    )
}

function CardButton({ icon, text, onClick }: any) {
    return (
        <Button
            variant="outline"
            onClick={onClick}
            paddingY={10}
            size="lg"
            colorPalette="brand.dark"
            borderColor="gray.400"
        >
            {icon} {text} <LuChevronRight />
        </Button>
    )
}

function SpreadsheetPage({ data, outputName: defaultOutputName, columnData, onBack }: PageProps) {
    const [sheetName, setSheetName] = useState("Sheet 1");
    const [outputName, setOutputName] = useState(defaultOutputName);
    const [columns, setColumns] = useState<string[]>([]);
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
    const [modifiedColumns, setModifiedColumns] = useState<{ key: string; name: string }[]>([]);

    useEffect(() => {
        const columnNames = columnData.map(col => col.name);
        setColumns(columnNames);
    }, [columnData]);

    useEffect(() => {
        const hidden = [];

        for (const column of columnData) {
            if (!column.shown) {
                hidden.push(column.key);
            }
        }
        setHiddenColumns(hidden);
    }, [columnData]);

    const exportToSpreadsheet = () => {
        const findInColumnData = (key: string) => {
            for (const column of columnData) {
                if (column.key === key) {
                    return column;
                }
            }
            return null;
        }

        const modifiedData = data.map((item: any) => {
            const modifiedItem: { [key: string]: any } = {};

            Object.keys(item).forEach((key) => {
                let origColumnName;

                for (const column of columnData) {
                    if (column.key === key) {
                        origColumnName = column.name;
                    }
                }

                if (!hiddenColumns.includes(key)) {
                    const column = findInColumnData(key);
                    let newItem = item[key];

                    if (column && column.boolean !== undefined) {
                        newItem = Boolean(newItem) ? "Yes" : "No";
                    }
                    const modifiedColumn = modifiedColumns.find((column) => column.key === key);
                    const columnName = modifiedColumn ? modifiedColumn.name : origColumnName ? origColumnName : key;
                    modifiedItem[columnName] = newItem;
                }
            });
            return modifiedItem;
        });

        const workbook = XLSX.utils.book_new();
        const sheetData = XLSX.utils.json_to_sheet(modifiedData);
        XLSX.utils.book_append_sheet(workbook, sheetData, sheetName);
        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });
        const dataBlob = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${outputName}.xlsx`);
        link.click();
        URL.revokeObjectURL(url);
    }

    const handleColumnToggle = (column: string) => {
        setHiddenColumns((prevHiddenColumns) => {
            if (prevHiddenColumns.includes(column)) {
                return prevHiddenColumns.filter((c) => c !== column);
            } else {
                return [...prevHiddenColumns, column];
            }
        });
    }

    const handleColumnNameChange = (column: string, name: string) => {
        setModifiedColumns((prevModifiedColumns) => {
            const existingModifiedColumn = prevModifiedColumns.find((modColumn) => modColumn.key === column);
            if (existingModifiedColumn) {
                return prevModifiedColumns.map((modColumn) =>
                    modColumn.key === column ? { ...modColumn, name } : modColumn
                );
            } else {
                return [...prevModifiedColumns, { key: column, name }];
            }
        });
    }

    return (
        <>
            <Stack gap="6">
                <SimpleGrid columns={{ base: 1, md: 2 }} gap="6" position="sticky">
                    <Field.Root>
                        <Field.Label>Sheet Name</Field.Label>
                        <Input
                            type="text"
                            value={sheetName}
                            onChange={(e) => setSheetName(e.target.value)}
                        />
                    </Field.Root>

                    <Field.Root>
                        <Field.Label>Output File Name</Field.Label>
                        <Input
                            type="text"
                            value={outputName}
                            onChange={(e) => setOutputName(e.target.value)}
                        />
                    </Field.Root>
                </SimpleGrid>

                <Box>
                    <Text marginBottom={2} fontWeight={600}>Edit Columns</Text>
                    <Stack gap="1">
                        {columnData.map(column => {
                            const isHidden = hiddenColumns.includes(column.key);
                            const modifiedColumn = modifiedColumns.find((modColumn) => modColumn.key === column.key);
                            const columnName = modifiedColumn ? modifiedColumn.name : column.name;

                            return (
                                <HStack key={column.key}>
                                    <Checkbox
                                        colorScheme="purple"
                                        checked={!isHidden}
                                        onCheckedChange={() => handleColumnToggle(column.key)}
                                    />
                                    <Input
                                        type="text"
                                        value={columnName}
                                        onChange={(e) => handleColumnNameChange(column.key, e.target.value)}
                                    />
                                </HStack>
                            )
                        })}
                    </Stack>
                </Box>
            </Stack>

            <Flex gap={4} marginTop={4}>
                <Button
                    marginRight="auto"
                    onClick={() => onBack()}
                    variant="outline"
                    colorPalette="brand.dark"
                    height={8}
                >
                    <LuChevronLeft /> Back
                </Button>
                <Button
                    onClick={() => exportToSpreadsheet()}
                    height={8}
                >
                    Export
                </Button>
            </Flex>
        </>
    )
}

function JsonPage({ data, outputName: defaultOutputName, columnData, onBack }: PageProps) {
    const [outputName, setOutputName] = useState(defaultOutputName);
    const [columns, setColumns] = useState<string[]>([]);
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

    useEffect(() => {
        const columnNames = columnData.map(col => col.key);
        setColumns(columnNames);
    }, [columnData]);

    useEffect(() => {
        const hidden = [];

        for (const column of columnData) {
            if (!column.shown) {
                hidden.push(column.key);
            }
        }
        setHiddenColumns(hidden);
    }, [columnData]);

    const exportToJson = () => {
        const findInColumnData = (key: string) => {
            for (const column of columnData) {
                if (column.key === key) {
                    return column;
                }
            }
            return null;
        }

        const modifiedData = data.map((item: any) => {
            const modifiedItem: { [key: string]: any } = {};

            Object.keys(item).forEach((key) => {
                if (!hiddenColumns.includes(key)) {
                    const column = findInColumnData(key);
                    let newItem = item[key];

                    if (column && column.boolean === true) {
                        newItem = Boolean(newItem);
                    }
                    modifiedItem[key] = newItem;
                }
            });
            return modifiedItem;
        });

        const json = JSON.stringify(modifiedData, null, 4);
        const dataBlob = new Blob([json], {
            type: "application/json",
        });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${outputName}.json`);
        link.click();
        URL.revokeObjectURL(url);
    }

    const handleColumnToggle = (column: string) => {
        setHiddenColumns((prevHiddenColumns) => {
            if (prevHiddenColumns.includes(column)) {
                return prevHiddenColumns.filter((c) => c !== column);
            } else {
                return [...prevHiddenColumns, column];
            }
        });
    }

    return (
        <>
            <Stack gap="6">
                <Field.Root>
                    <Field.Label>Output File Name</Field.Label>
                    <Input
                        type="text"
                        value={outputName}
                        onChange={(e) => setOutputName(e.target.value)}
                    />
                </Field.Root>

                <Stack gap="0">
                    <Text marginBottom={2} fontWeight={600}>Edit Columns</Text>
                    
                    {columns.map(column => {
                        const isHidden = hiddenColumns.includes(column);

                        return (
                            <HStack key={column} marginBottom={1}>
                                <Checkbox
                                    colorScheme="purple"
                                    checked={!isHidden}
                                    onCheckedChange={() => handleColumnToggle(column)}
                                />
                                <Text>{column}</Text>
                            </HStack>
                        )
                    })}
                </Stack>
            </Stack>

            <Flex gap={4} marginTop={4}>
                <Button
                    marginRight="auto"
                    onClick={() => onBack()}
                    variant="outline"
                    colorPalette="brand.dark"
                    height={8}
                >
                    <LuChevronLeft /> Back
                </Button>
                <Button
                    onClick={() => exportToJson()}
                    height={8}
                >
                    Export
                </Button>
            </Flex>
        </>
    )
}

export default React.memo(ExportTableDrawer);