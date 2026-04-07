import { RowDataPacket } from "mysql2";
import { AuditLog } from "../entities/AuditLog";
import { pool } from "../mysql";

export async function getAuditLogs(
    agentName?: string,
    customerName?: string,
    action?: string,
    fromDate?: string,
    toDate?: string,
    sortBy?: string,
    sortDir: "asc" | "desc" = "desc",
    page = 1,
    pageSize = 20
): Promise<{ logs: AuditLog[]; totalPages: number, totalItems: number }> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (agentName) {
        conditions.push("agents.display_name LIKE ?");
        params.push(`%${agentName}%`);
    }
    if (customerName) {
        conditions.push("customers.name LIKE ?");
        params.push(`%${customerName}%`);
    }
    if (action) {
        conditions.push("audit_logs.action LIKE ?");
        params.push(`%${action}%`);
    }
    if (fromDate) {
        conditions.push("audit_logs.created_at >= ?");
        params.push(fromDate);
    }
    if (toDate) {
        conditions.push("audit_logs.created_at <= ?");
        params.push(toDate);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderClause = sortBy ? `ORDER BY ${sortBy} ${sortDir}` : "ORDER BY audit_logs.created_at DESC";
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT 
            audit_logs.*,
            agents.display_name AS agent_name,
            customers.name AS customer_name
        FROM audit_logs
        LEFT JOIN agents ON agents.id = audit_logs.agent_id
        LEFT JOIN customers ON customers.id = audit_logs.customer_id
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
    `,
        [...params, pageSize, offset]
    );

    const [[{ total }]] = await pool.query<RowDataPacket[]>(`
        SELECT COUNT(*) AS total
        FROM audit_logs
        LEFT JOIN agents ON agents.id = audit_logs.agent_id
        LEFT JOIN customers ON customers.id = audit_logs.customer_id
        ${whereClause}
    `,
        params
    );

    return {
        logs: rows as AuditLog[],
        totalItems: total,
        totalPages: Math.ceil(total / pageSize)
    }
}

export async function createAuditLog<T>(data: Partial<AuditLog<T>>): Promise<AuditLog> {
    let parsedDetails;

    if (data.details) {
        parsedDetails = JSON.stringify(data.details as any);
    }

    const [result] = await pool.query("INSERT INTO audit_logs (agent_id, customer_id, action, row_id, details_version, details) VALUES (?, ?, ?, ?, ?, ?)", [
        data.agent_id || null,
        data.customer_id || null,
        data.action || null,
        data.row_id || null,
        data.details_version || 1,
        parsedDetails || null
    ]);

    const insertId = (result as any).insertId;

    const [rows] = await pool.query("SELECT * FROM audit_logs WHERE id = ?", [insertId]);
    return (rows as any[])[0] as AuditLog;
}