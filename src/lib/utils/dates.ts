function normalizeDate(input: string | Date): Date | null {
    if (!input) {
        return null;
    }
    const d = input instanceof Date ? input : new Date(input);
    return isNaN(d.getTime()) ? null : d;
}

export function formatTimeAgo(
    input: string | Date | number,
    options?: { showSeconds?: boolean }
): string {
    let diffMs: number;

    if (typeof input === "number") {
        diffMs = input;
    } else {
        const date = normalizeDate(input);
        if (!date) return "-";
        diffMs = Date.now() - date.getTime();
    }

    if (diffMs < 0) {
        return "just now";
    }

    const secs = Math.floor(diffMs / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    const plural = (value: number, unit: string) => `${value} ${unit}${value === 1 ? "" : "s"} ago`;

    if (secs < 60) {
        return options?.showSeconds ? plural(secs, "second") : "just now";
    }
    if (mins < 60) return plural(mins, "min");
    if (hours < 24) return plural(hours, "hour");
    if (days < 7) return plural(days, "day");
    if (days < 30) return plural(weeks, "week");
    if (days < 365) return plural(months, "month");
    return plural(years, "year");
}

export function formatDate(input: string | Date): string {
    const date = normalizeDate(input);

    if (!date) {
        return "-";
    }
    return date.toISOString().split("T")[0];
}

export function formatDateTime(input: string | Date): string {
    const date = normalizeDate(input);

    if (!date) {
        return "-";
    }

    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatDateReadable(input: string | Date): string {
    const date = normalizeDate(input);

    if (!date) {
        return "-";
    }
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}
