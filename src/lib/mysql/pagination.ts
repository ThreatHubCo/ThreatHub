export interface PaginationOptions {
    page?: number;
    pageSize?: number;
}

export interface PaginatedResult<T> {
    items: T[];
    totalItems: number;
    totalPages: number;
}

export function getPagination({ page = 1, pageSize = 20 }: PaginationOptions = {}) {
    const safePage = Math.max(1, Math.floor(page));
    const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));

    return {
        page: safePage,
        pageSize: safePageSize,
        offset: (safePage - 1) * safePageSize,
    }
}

export function getTotalPages(totalItems: number, pageSize: number): number {
    return Math.ceil(totalItems / pageSize);
}