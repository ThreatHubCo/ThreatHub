import { RowDataPacket } from "mysql2";
import { BackendLog } from "../entities/BackendLog";
import { pool } from "../mysql";
import { WhereBuilder } from "../mysql/filters";

export async function getRecentCustomerLogs(customerId: number, limit: number = 10): Promise<BackendLog[]> {
    const [rows] = await pool.query("SELECT * FROM backend_logs WHERE level NOT IN ('DEBUG') AND customer_id = ? ORDER BY created_at DESC LIMIT ?", [
        customerId,
        limit
    ]);
    return rows as any[];
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
): Promise<{
    logs: BackendLog[];
    totalItems: number;
    totalPages: number;
}> {
    const where = new WhereBuilder()
        .like("c.name", customerName)
        .like("bl.source", source)
        .like("bl.text", text)
        .equals("bl.level", level)
        .addIf(!!fromDate, "bl.created_at >= ?", fromDate)
        .addIf(!!toDate, "bl.created_at <= ?", toDate);

    const { sql: whereClause, params } = where.build();
  
    const orderColumn = sortBy ?? "bl.created_at";
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
    `, [...params, pageSize, offset]);

    const [[{ total }]] = await pool.query<RowDataPacket[]>(`
        SELECT COUNT(*) AS total
        FROM backend_logs bl
        LEFT JOIN customers c ON c.id = bl.customer_id
        ${whereClause}
    `, params);

    return {
        logs: rows as BackendLog[],
        totalItems: total,
        totalPages: Math.ceil(total / pageSize)
    }
}