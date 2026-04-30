import { useState } from "react";

export interface TableMetaProps {
    tableMeta: TableMetaInner;
    setTableMeta: (meta: TableMetaInner) => void;
}

export interface TableMetaInner {
    totalItems: number;
    totalPages: number;
}

export function useTableMeta(): TableMetaProps {
    const [meta, setMeta] = useState<TableMetaInner>({
        totalItems: 0,
        totalPages: 0
    });

    return {
        tableMeta: {
            totalItems: meta?.totalItems,
            totalPages: meta?.totalPages
        },
        setTableMeta: setMeta
    }
}