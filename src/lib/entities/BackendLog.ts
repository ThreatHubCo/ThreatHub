export interface BackendLog {
    id: number;
    created_at: string;
    level: string;
    source: string;
    text: string;
    customer_id: number | null;
    customer_name?: string | null;
}