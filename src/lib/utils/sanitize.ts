export function sanitize<T extends object>(obj: T, fields: string[]): Omit<T, keyof typeof fields[number]> {
    const copy = { ...obj } as any;
    fields.forEach((f) => delete copy[f]);
    return copy;
}

export function sanitizeArray<T extends object>(arr: T[], fields: string[]) {
    return arr.map((item) => sanitize(item, fields));
}
