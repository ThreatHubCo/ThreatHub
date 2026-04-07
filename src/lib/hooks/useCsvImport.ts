import { useState } from "react";
import Papa from "papaparse";

export interface CsvImportConfig<T> {
    headers: readonly (keyof T)[];
    endpoint: string;
    mapRow?: (row: Record<string, string>) => T;
    setOpen: (value: boolean) => void;
}

export function useCsvImport<T>({
    headers,
    endpoint,
    mapRow,
    setOpen
}: CsvImportConfig<T>) {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<T[]>([]);

    function downloadTemplate() {
        const csv = headers.join(",") + "\n";
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "import-template.csv";
        a.click();

        URL.revokeObjectURL(url);
    }

    async function parseCsv(file: File) {
        setError(null);

        return new Promise<void>((resolve, reject) => {
            Papa.parse<Record<string, string>>(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const csvHeaders = results.meta.fields ?? [];
                    const missingHeaders = headers.filter(h => !csvHeaders.includes(String(h)));

                    if (missingHeaders.length) {
                        reject(new Error(`Missing required headers: ${missingHeaders.join(", ")}`));
                        return;
                    }

                    const parsed = results.data.map((row) => mapRow ? mapRow(row) : (row as unknown as T));

                    setRows(parsed);
                    resolve();
                },
                error: (err) => reject(err),
            });
        });
    }

    function validateFile(file: File) {
        if (!file.name.endsWith(".csv")) {
            throw new Error("Only CSV files are allowed");
        }
        if (file.size === 0) {
            throw new Error("File is empty");
        }
    }

    async function handleFileSelect(file: File) {
        try {
            validateFile(file);
            setFile(file);
            await parseCsv(file);
        } catch (e) {
            setError(e.message);
        }
    }

    async function submit() {
        if (!rows.length) {
            setError("No valid rows to import");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rows })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data?.error || "Import failed");
            }

            setFile(null);
            setRows([]);
            setOpen(false);
        } catch (e: any) {
            setError(e.message ?? "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return {
        file,
        rows,
        error,
        loading,
        downloadTemplate,
        handleFileSelect,
        submit
    }
}