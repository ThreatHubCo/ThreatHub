import { useCallback, useState } from "react";

export type SortState<T> = {
    key?: keyof T;
    direction?: "asc" | "desc";
}

export function useTableQuery<T>() {
    const [page, setPage] = useState(1);
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
            return { key, direction };
        });
    }, []);

    const reset = useCallback(() => {
        setPage(1);
        setFilters({});
        setSort({});
    }, []);

    return {
        page,
        filters,
        sort,
        setPage,
        setFilters: updateFilters,
        setSort: updateSort,
        reset
    }
}
