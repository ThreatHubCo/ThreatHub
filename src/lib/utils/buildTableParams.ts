interface Props {
    page: number;
    pageSize: number;
    filters: Record<string, any>;
    sort?: { key?: string; direction?: "asc" | "desc" };
}

export function buildTableParams({ page, pageSize, filters, sort}: Props) {
    const filteredFilters = Object.fromEntries(
        Object.entries(filters).filter(
            ([, value]) => value !== undefined && value !== null && value !== ""
        )
    );

    const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...filteredFilters
    });

    if (sort?.key) {
        params.set("sortBy", sort.key);
        params.set("sortDir", sort.direction!);
    }
    return params;
}