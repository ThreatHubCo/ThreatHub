import { useCallback, useState } from "react";

export type SortState<T> = {
    key?: keyof T;
    direction?: "asc" | "desc";
}

export type Filter<T> = {
    key: keyof T | string;
    label: string;
    required?: string;
    type: "text" | "select" | "date" | "boolean" | "number";
    options?: {
        value: string;
        label: string;
    }[];
    text?: string;
    defaultValue?: any;
}

export type TableQueryState<T> = {
    page: number;
    limit: number;
    filters: Record<string, any>;
    sort: SortState<T>;
}

export interface TableQueryProps<T> {
    initialFilters: Filter<T>[];
    state: TableQueryState<T>;
    actions: {
        setPage: (p: number) => void;
        setLimit: (n: number) => void;
        setFilters: (f: Record<string, any>) => void;
        setSort: (key: keyof T) => void;
        reset: () => void;
    }
}

export function useTableQuery<T>(initialLimit = 10, initialFilters: Filter<T>[] = []): TableQueryProps<T> {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(initialLimit);
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [sort, setSort] = useState<SortState<T>>({});

    const updateFilters = useCallback((next: Record<string, any>) => {
        setPage(1);
        setFilters(next);
    }, []);

    const updateSort = useCallback((key: keyof T) => {
        setPage(1);
        setSort(prev => {
            const direction = prev.key === key && prev.direction === "asc" ? "desc" : "asc";
            return { key, direction }
        });
    }, []);

    const reset = useCallback(() => {
        setPage(1);
        setFilters({});
        setSort({});
    }, []);

    return {
        initialFilters,

        state: {
            page,
            limit,
            filters,
            sort,
        } as TableQueryState<T>,

        actions: {
            setPage,
            setLimit,
            setFilters: updateFilters,
            setSort: updateSort,
            reset
        }
    }
}