import { TableQueryProps } from "../hooks/useTableQuery";

export function buildTableParams<T>({ state }: Partial<TableQueryProps<T>>) {
    const { page, limit, filters, sort } = state;

    const filteredFilters = Object.fromEntries(
        Object.entries(filters).filter(
            ([, value]) => value !== undefined && value !== null && value !== ""
        )
    );

    const params = new URLSearchParams({
        page: String(page),
        pageSize: String(limit),
        ...Object.fromEntries(
            Object.entries(filteredFilters).map(([k, v]) => [k, String(v)])
        )
    });

    if (sort?.key) {
        params.set("sortBy", String(sort.key));
        params.set("sortDir", (sort as any).direction ?? "asc");
    }
    return params;
}