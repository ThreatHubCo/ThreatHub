import { RemediationTicket } from "../entities/RemediationTicket";
import { pool, updateById } from "../mysql";

export async function getRemediationTicketById(id: number): Promise<RemediationTicket> {
    const [rows] = await pool.query("SELECT * FROM remediation_tickets WHERE id = ?", [id]);
    return  (rows as any[])[0] || null;
}

export async function getAllRemediationTickets(): Promise<RemediationTicket[]> {
    const [rows] = await pool.query("SELECT * FROM remediation_tickets");
    return rows as RemediationTicket[];
}

export async function getRemediationTicketsForCustomer(customerId: number): Promise<RemediationTicket[]> {
    const [rows] = await pool.query("SELECT * FROM remediation_tickets WHERE customer_id = ?", [customerId]);
    return rows as RemediationTicket[];
}

export async function createRemediationTicket(data: Partial<RemediationTicket>): Promise<RemediationTicket> {
    const {
        software_id,
        customer_id,
        external_ticket_id,
        status,
        notes,
        opened_by_agent_id
    } = data;

    const [result] = await pool.query(`
        INSERT INTO remediation_tickets (
            software_id,
            customer_id,
            external_ticket_id,
            status,
            notes,
            opened_by_agent_id
        ) VALUES (?, ?, ?, ?, ?, ?)
    `,
        [
            software_id || null,
            customer_id, external_ticket_id, status,
            notes || null,
            opened_by_agent_id
        ]
    );

    const insertId = (result as any).insertId;

    const [rows] = await pool.query("SELECT * FROM remediation_tickets WHERE id = ?", [insertId]);
    return (rows as any[])[0] as RemediationTicket;
}

export async function updateRemediationTicket(id: number, data: Partial<RemediationTicket>): Promise<RemediationTicket | null> {
    const updatedRows = await updateById<RemediationTicket>("remediation_tickets", id, data);
    
    if (!updatedRows) {
        return null;
    }
    return getRemediationTicketById(id);
}

export async function getRemediationTicketsGlobal(
    customerId?: number,
    status?: string,
    openedByAgent?: string,
    externalTicketId?: string,
    page = 1,
    pageSize = 20,
    sortBy?: string,
    sortDir: "asc" | "desc" = "desc"
): Promise<{ tickets: any[]; totalItems: number; totalPages: number }> {

    const conditions: string[] = [];
    const params: any[] = [];

    if (customerId) {
        conditions.push("rt.customer_id = ?");
        params.push(customerId);
    }

    if (status) {
        conditions.push("rt.status = ?");
        params.push(status);
    }

    if (openedByAgent) {
        conditions.push("a.display_name LIKE ?");
        params.push(`%${openedByAgent}%`);
    }
    
    if (externalTicketId) {
        conditions.push("rt.external_ticket_id = ?");
        params.push(externalTicketId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderClause = sortBy ? `ORDER BY ${sortBy} ${sortDir}` : `ORDER BY rt.created_at DESC`;
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query<any[]>(`
        SELECT
            rt.id,
            rt.external_ticket_id,
            rt.status,
            rt.notes,
            rt.created_at,
            rt.last_ticket_update_at,
            rt.last_sync_at,
            rt.customer_id,
            c.name AS customer_name,
            rt.software_id,
            COALESCE(s.formatted_name, s.name) AS software_name,
            COALESCE(s.formatted_vendor, s.vendor) AS software_vendor,
            rt.opened_by_agent_id,
            a.display_name AS opened_by_agent_name
        FROM 
            remediation_tickets rt
        INNER JOIN customers c ON c.id = rt.customer_id
        LEFT JOIN agents a ON a.id = rt.opened_by_agent_id
        LEFT JOIN software s ON s.id = rt.software_id
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
    `,
        [...params, pageSize, offset]
    );

    const [[{ total }]] = await pool.query<any[]>(`
        SELECT COUNT(*) AS total
        FROM remediation_tickets rt
        INNER JOIN customers c ON c.id = rt.customer_id
        LEFT JOIN agents a ON a.id = rt.opened_by_agent_id
        LEFT JOIN software s ON s.id = rt.software_id
        ${whereClause}
    `,
        params
    );

    return {
        tickets: rows,
        totalItems: Number(total || 0),
        totalPages: Math.ceil(Number(total || 0) / pageSize)
    }
}

export async function getRemediationTicketsForSoftware(
    softwareId: number,
    customerId?: number,
    status?: string,
    openedByAgent?: string,
    externalTicketId?: string,
    page = 1,
    pageSize = 20,
    sortBy?: string,
    sortDir: "asc" | "desc" = "desc"
): Promise<{ tickets: any[]; totalItems: number; totalPages: number }> {

    const conditions: string[] = [];
    const params: any[] = [];
    
    conditions.push("rt.software_id = ?");
    params.push(softwareId);

    if (customerId) {
        conditions.push("rt.customer_id = ?");
        params.push(customerId);
    }

    if (status) {
        conditions.push("rt.status = ?");
        params.push(status);
    }

    if (openedByAgent) {
        conditions.push("a.display_name LIKE ?");
        params.push(`%${openedByAgent}%`);
    }
    
    if (externalTicketId) {
        conditions.push("rt.external_ticket_id = ?");
        params.push(externalTicketId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderClause = sortBy ? `ORDER BY ${sortBy} ${sortDir}` : `ORDER BY rt.created_at DESC`;
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query<any[]>(`
        SELECT
            rt.id,
            rt.external_ticket_id,
            rt.status,
            rt.notes,
            rt.created_at,
            rt.last_ticket_update_at,
            rt.last_sync_at,
            rt.customer_id,
            c.name AS customer_name,
            rt.software_id,
            COALESCE(s.formatted_name, s.name) AS software_name,
            COALESCE(s.formatted_vendor, s.vendor) AS software_vendor,
            rt.opened_by_agent_id,
            a.display_name AS opened_by_agent_name

        FROM remediation_tickets rt
        INNER JOIN customers c ON c.id = rt.customer_id
        LEFT JOIN agents a ON a.id = rt.opened_by_agent_id
        LEFT JOIN software s ON s.id = rt.software_id
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
    `,
        [...params, pageSize, offset]
    );

    const [[{ total }]] = await pool.query<any[]>(`
        SELECT COUNT(*) AS total
        FROM remediation_tickets rt
        INNER JOIN customers c ON c.id = rt.customer_id
        LEFT JOIN agents a ON a.id = rt.opened_by_agent_id
        LEFT JOIN software s ON s.id = rt.software_id
        ${whereClause}
    `,
        params
    );

    return {
        tickets: rows,
        totalItems: Number(total || 0),
        totalPages: Math.ceil(Number(total || 0) / pageSize)
    }
}