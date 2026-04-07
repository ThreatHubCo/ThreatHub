import { useState, useCallback } from "react";

export function usePagination(initialPage = 1, initialPageSize = 20) {
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);

    const goToPage = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    const changePageSize = useCallback((newSize: number) => {
        setPageSize(newSize);
        setPage(1);
    }, []);

    const offset = (page - 1) * pageSize;

    return { page, pageSize, offset, goToPage, changePageSize, setPage, setPageSize }
}
