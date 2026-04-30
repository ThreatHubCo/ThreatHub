import ExportTableDrawer, { ExportDataColumn } from "@/components/table/ExportTableDrawer";
import { TableSettingsDrawer } from "@/components/table/TableSettingsDrawer";
import { TableToolbar } from "@/components/table/TableToolbar";
import { useColumnSelector } from "@/lib/hooks/useColumnSelectorDrawer";
import { TableMetaInner } from "@/lib/hooks/useTableMeta";
import { TableQueryProps } from "@/lib/hooks/useTableQuery";
import { Button, Flex, HStack, IconButton, Spinner, Stack, Table, Text } from "@chakra-ui/react";
import React, { useState } from "react";
import { LuChevronDown, LuChevronsUpDown, LuChevronUp, LuDownload, LuSettings } from "react-icons/lu";
import { DateTextWithHover } from "../DateTextWithHover";
import { FilterPopover } from "../FilterPopover";
import { LoadingWrapper } from "../LoadingWrapper";
import { WhiteBox } from "../box/WhiteBox";
import { TableState, TableStateWrapper } from "./TableStateWrapper";

export interface ExportOptions {
    dataUrl?: string;
    outputFileName: string;
    columns: ExportDataColumn[];
    fetchDataFn?: () => Promise<any[]>;
    getDataArray?: (json: any) => any[];
}

export type Column<T> = {
    key: keyof T | string;
    label: string;
    sortable?: boolean;
    width?: string;
    render?: (row: T) => React.ReactNode;
}

type DataTableProps<T> = {
    data: T[];
    columns: Column<T>[];
    defaultColumns: string[];
    id?: string;
    exportOptions?: ExportOptions;
    tableQuery?: TableQueryProps<T>;
    tableMeta?: TableMetaInner;
    error?: string;
    state: TableState;
}

export function DataTable<T extends { id: string | number }>({
    data,
    columns,
    defaultColumns,
    id,
    exportOptions,
    tableQuery,
    tableMeta,
    error,
    state
}: DataTableProps<T>) {
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const { initialFilters, state: queryState, actions: queryActions } = tableQuery ?? {};

    const columnSelector = useColumnSelector(id!, columns, defaultColumns, true);

    return (
        <TableStateWrapper state={state} error={error}>
            <WhiteBox>
                <Stack
                    gap={2}
                    position="relative"
                >
                    <LoadingWrapper
                        loading={state === TableState.LOADING}
                        error={error}
                        marginTop={4}
                    >
                        {(data && tableMeta) && (
                            <TableToolbar
                                itemCount={data.length}
                                totalCount={tableMeta.totalItems}
                                ColumnSelectorButton={() => (
                                    <IconButton
                                        aria-label="Select columns"
                                        size="sm"
                                        onClick={() => columnSelector.setOpen(true)}
                                        height={4}
                                        variant="plain"
                                        colorPalette="brand.dark"
                                    >
                                        <LuSettings />
                                    </IconButton>
                                )}
                                ExportButton={() => exportOptions ? (
                                    <IconButton
                                        aria-label="Export data"
                                        size="sm"
                                        onClick={() => setExportDialogOpen(true)}
                                        height={4}
                                        variant="ghost"
                                    >
                                        <LuDownload />
                                    </IconButton>
                                ) : null}
                            />
                        )}

                        {initialFilters && (
                            <HStack gap={2} flexWrap="wrap">
                                {initialFilters
                                    ?.sort((a, b) => {
                                        const colOrder = columns.map(col => String(col.key));

                                        const aIndex = colOrder.indexOf(String(a.key));
                                        const bIndex = colOrder.indexOf(String(b.key));

                                        if (aIndex === -1 && bIndex === -1) return 0;
                                        if (aIndex === -1) return 1;
                                        if (bIndex === -1) return -1;

                                        return aIndex - bIndex;
                                    })
                                    ?.filter(filter => {
                                        if (filter?.required) {
                                            // return columnSelector.visibleColumns?.some(col => col.key === filter.required);
                                        }
                                        return true;
                                    })
                                    .map((filter) => (
                                        <FilterPopover
                                            key={String(filter.key)}
                                            label={filter.label}
                                            type={filter.type}
                                            value={queryState.filters[String(filter.key)] || ""}
                                            options={filter.options}
                                            text={filter.text}
                                            onApply={(val) => {
                                                const newFilters = { ...queryState.filters, [filter.key]: val };
                                                queryActions.setFilters(newFilters);
                                            }}
                                        />
                                    ))}
                            </HStack>
                        )}

                        {!data && (
                            <Flex justifyContent="center" alignItems="center">
                                <Flex direction="column" alignItems="center" gap={4}>
                                    <Spinner />
                                    <Text>Loading</Text>
                                </Flex>
                            </Flex>
                        )}

                        {data && (
                            <Table.ScrollArea borderWidth="1px" maxWidth="100%" whiteSpace="normal">
                                <Table.Root size="sm" variant="outline">
                                    <Table.Header>
                                        <Table.Row>
                                            {columnSelector.visibleColumns.map((col) => (
                                                <Table.ColumnHeader
                                                    key={String(col.key)}
                                                    width={col.width}
                                                    onClick={col.sortable ? () => queryActions.setSort(col.key as any) : undefined}
                                                >
                                                    <HStack gap={1}>
                                                        <span>{col.label}</span>

                                                        {col.sortable && (
                                                            <SortIcon
                                                                active={queryState.sort?.key === col.key}
                                                                direction={queryState.sort?.direction}
                                                            />
                                                        )}
                                                    </HStack>
                                                </Table.ColumnHeader>
                                            ))}
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {data.map((row) => (
                                            <Table.Row key={row.id}>
                                                {columnSelector.visibleColumns.map((col) => {
                                                    const content = col.render ? col.render(row) : String(row[col.key as string] ?? "");

                                                    // Check if the render output is a DateTextWithHover component
                                                    if (React.isValidElement(content) && content.type === DateTextWithHover) {
                                                        return (
                                                            <Table.Cell key={String(col.key)}>
                                                                {React.cloneElement(content, { reverse: columnSelector.flipDates } as any)}
                                                            </Table.Cell>
                                                        );
                                                    }

                                                    return <Table.Cell key={String(col.key)}>{content}</Table.Cell>;
                                                })}
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table.Root>
                            </Table.ScrollArea>
                        )}

                        {(tableMeta && tableMeta.totalPages) > 1 && (
                            <HStack justify="center" mt={2}>
                                <Button
                                    disabled={queryState.page === 1}
                                    onClick={() => queryActions.setPage(queryState.page - 1)}
                                    height={8}
                                >
                                    Prev
                                </Button>
                                <span>
                                    Page {queryState.page} of {tableMeta.totalPages}
                                </span>
                                <Button
                                    disabled={queryState.page === tableMeta.totalPages}
                                    onClick={() => queryActions.setPage(queryState.page + 1)}
                                    height={8}
                                >
                                    Next
                                </Button>
                            </HStack>
                        )}
                    </LoadingWrapper>

                    <TableSettingsDrawer
                        open={columnSelector.open}
                        onOpen={columnSelector.setOpen}
                        allColumns={columns}
                        visibleColumnIds={columnSelector.visibleColumnIds}
                        flipDates={columnSelector.flipDates}
                        onSave={(ids, flip) => {
                            columnSelector.setVisibleColumnIds(ids);
                            columnSelector.setFlipDates(flip);
                            localStorage.setItem(`${id}.columns`, JSON.stringify(ids));
                            localStorage.setItem(`${id}.flipDates`, JSON.stringify(flip));
                            columnSelector.setOpen(false);
                        }}
                    />

                    {exportOptions && (
                        <ExportTableDrawer
                            open={exportDialogOpen}
                            onClose={() => setExportDialogOpen(false)}
                            outputFileName={exportOptions.outputFileName}
                            dataUrl={exportOptions.dataUrl}
                            getDataArray={exportOptions.getDataArray}
                            fetchDataFn={exportOptions.fetchDataFn}
                            columns={exportOptions.columns}
                        />
                    )}
                </Stack>
            </WhiteBox>
        </TableStateWrapper>
    );
}

type SortDirection = "asc" | "desc";

interface SortIconProps {
    active: boolean;
    direction?: SortDirection;
}

const SortIcon = ({ active, direction }: SortIconProps) => {
    if (!active) {
        return <LuChevronsUpDown size={14} opacity={0.5} />
    }
    return direction === "asc" ? <LuChevronUp size={14} /> : <LuChevronDown size={14} />
}