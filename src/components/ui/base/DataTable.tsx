import { AbsoluteCenter, Box, Button, Flex, HStack, IconButton, Spinner, Stack, Table, Text } from "@chakra-ui/react";
import { FilterPopover } from "../FilterPopover";
import { TableToolbar } from "@/components/table/TableToolbar";
import { useColumnSelector } from "@/lib/hooks/useColumnSelectorDrawer";
import { useCallback, useState } from "react";
import { LuChevronDown, LuChevronsUpDown, LuChevronUp, LuDownload, LuSettings } from "react-icons/lu";
import { DateTextWithHover } from "../DateTextWithHover";
import React from "react";
import { TableSettingsDrawer } from "@/components/table/TableSettingsDrawer";
import ExportTableDrawer, { ExportDataColumn } from "@/components/table/ExportTableDrawer";
import { LoadingWrapper } from "../LoadingWrapper";

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

export type Filter<T> = {
    key: keyof T | string;
    label: string;
    type: "text" | "select" | "date" | "boolean" | "number";
    required?: string;
    options?: {
        value: string;
        label: string;
    }[];
    defaultValue?: string;
    text?: string;
}

type DataTableProps<T> = {
    data: T[];
    columns: Column<T>[];
    defaultColumns: string[];
    filters?: Filter<T>[];
    filterState?: Record<string, any>;
    onFilterChange?: (filters: Record<string, any>) => void;
    onSortChange?: (sortBy: keyof T, direction: "asc" | "desc") => void;
    onPageChange?: (page: number) => void;
    totalPages?: number;
    currentPage?: number;
    totalItems: number;
    sort?: any;
    id?: string;
    exportOptions?: ExportOptions;
    loading?: boolean;
    error?: string;
}

export function DataTable<T extends { id: string | number }>({
    data,
    columns,
    defaultColumns,
    filters,
    filterState,
    onFilterChange,
    onSortChange,
    onPageChange,
    totalPages = 1,
    currentPage = 1,
    totalItems = 1,
    sort,
    id,
    exportOptions,
    loading,
    error
}: DataTableProps<T>) {
    const columnSelector = useColumnSelector(
        id!,
        columns,
        defaultColumns,
        true
    );
    const [exportDialogOpen, setExportDialogOpen] = useState(false);

    const [sortState, setSortState] = useState<{ key?: keyof T; direction?: "asc" | "desc" }>({});

    const handleSort = useCallback(
        (key: keyof T) => {
            let direction: "asc" | "desc" = "asc";

            if (sort?.key === key) {
                direction = sort.direction === "asc" ? "desc" : "asc";
            }
            onSortChange?.(key, direction);
        },
        [sort, onSortChange]
    )

    return (
        <Stack
            gap={2}
            bgColor="white"
            padding={4}
            borderRadius={8}
            position="relative"
        >
            <LoadingWrapper
                loading={loading}
                error={error}
                marginTop={4}
            >
                {data && (
                    <TableToolbar
                        itemCount={data.length}
                        totalCount={totalItems}
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

                {filters && (
                    <HStack gap={2} flexWrap="wrap">
                        {filters
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
                                    value={filterState[String(filter.key)] || ""}
                                    options={filter.options}
                                    text={filter.text}
                                    onApply={(val) => {
                                        const newFilters = { ...filterState, [filter.key]: val };
                                        onFilterChange?.(newFilters);
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
                                            onClick={col.sortable ? () => handleSort(col.key as any) : undefined}
                                        >
                                            <HStack gap={1}>
                                                <span>{col.label}</span>

                                                {col.sortable && (
                                                    <SortIcon
                                                        active={sort?.key === col.key}
                                                        direction={sort?.direction}
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

                {totalPages > 1 && (
                    <HStack justify="center" mt={2}>
                        <Button
                            disabled={currentPage === 1}
                            onClick={() => onPageChange?.(currentPage - 1)}
                            height={8}
                        >
                            Prev
                        </Button>
                        <span>
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            disabled={currentPage === totalPages}
                            onClick={() => onPageChange?.(currentPage + 1)}
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