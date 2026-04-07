import { RowDataPacket } from "mysql2";
import { BackendLog } from "../entities/BackendLog";
import { pool } from "../mysql";

export async function getRecentCustomerLogs(customerId: number, limit: number = 10): Promise<BackendLog[]> {
    const [rows] = await pool.query("SELECT * FROM backend_logs WHERE level NOT IN ('DEBUG') AND customer_id = ? ORDER BY created_at DESC LIMIT ?", [
        customerId,
        limit
    ]);
    return rows as any[];
}

// TODO: Move to API route
const SORTABLE_COLUMNS: Record<string, string> = {
    id: "bl.id",
    created_at: "bl.created_at",
    level: "bl.level",
    source: "bl.source",
    text: "bl.text",
    customer_name: "c.name"
}

export async function getBackendLogs(
    customerName?: string,
    source?: string,
    text?: string,
    level?: string,
    fromDate?: string,
    toDate?: string,
    page = 1,
    pageSize = 20,
    sortBy?: string,
    sortDir: "asc" | "desc" = "desc"
): Promise<{ logs: BackendLog[]; totalItems: number; totalPages: number }> {

    const conditions: string[] = [];
    const params: any[] = [];

    if (customerName) {
        conditions.push("c.name LIKE ?");
        params.push(`%${customerName}%`);
    }

    if (source) {
        conditions.push("bl.source LIKE ?");
        params.push(`%${source}%`);
    }

    if (text) {
        conditions.push("bl.text LIKE ?");
        params.push(`%${text}%`);
    }

    if (level) {
        conditions.push("bl.level = ?");
        params.push(level);
    }

    if (fromDate) {
        conditions.push("bl.created_at >= ?");
        params.push(fromDate);
    }
    if (toDate) {
        conditions.push("bl.created_at <= ?");
        params.push(toDate);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderColumn = sortBy && SORTABLE_COLUMNS[sortBy] ? SORTABLE_COLUMNS[sortBy] : "bl.created_at";
    const orderClause = `ORDER BY ${orderColumn} ${sortDir}`;

    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
            bl.id,
            bl.created_at,
            bl.level,
            bl.source,
            bl.text,
            bl.customer_id,
            c.name AS customer_name
        FROM backend_logs bl
        LEFT JOIN customers c ON c.id = bl.customer_id
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
    `,
        [...params, pageSize, offset]
    );

    const [[{ total }]] = await pool.query<RowDataPacket[]>(`
        SELECT COUNT(*) AS total
        FROM backend_logs bl
        LEFT JOIN customers c ON c.id = bl.customer_id
        ${whereClause}
    `,
        params
    );

    return {
        logs: rows as BackendLog[],
        totalItems: total,
        totalPages: Math.ceil(total / pageSize)
    }
}