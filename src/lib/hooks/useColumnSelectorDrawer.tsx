import { Column } from "@/components/ui/base/DataTable";
import { useEffect, useMemo, useState } from "react";

export function useColumnSelector(
    storageKey: string,
    allColumns: Column<any>[],
    defaultVisible: string[],
    defaultFlipDates: boolean = true
) {
    const [open, setOpen] = useState(false);
    const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(defaultVisible);
    const [flipDates, setFlipDates] = useState(defaultFlipDates);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(`${storageKey}.columns`);
            if (!stored) {
                return;
            }

            const parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) {
                return;
            }

            const validIds = parsed.filter(id => allColumns.some(col => col.key === id));
            setVisibleColumnIds(validIds.length ? validIds : defaultVisible);
        } catch {
            setVisibleColumnIds(defaultVisible);
        }

        try {
            const stored = localStorage.getItem(`${storageKey}.flipDates`);
            if (stored === null) {
                return;
            }
            setFlipDates(stored === "true");
        } catch {
            setFlipDates(defaultFlipDates);
        }
    }, [storageKey]);

    const visibleColumns = useMemo(() => allColumns.filter(col => visibleColumnIds.includes(col.key as string)), [allColumns, visibleColumnIds]);
    const safeColumns = visibleColumns.length ? visibleColumns : allColumns;

    return {
        visibleColumns: safeColumns,
        visibleColumnIds,
        flipDates,
        open,
        setOpen,
        setVisibleColumnIds,
        setFlipDates
    }
}