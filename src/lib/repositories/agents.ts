import { hash } from "bcrypt";
import { RowDataPacket } from "mysql2";
import { Agent } from "../entities/Agent";
import { pool, updateById } from "../mysql";

export async function getAllAgents(
    name?: string,
    email?: string,
    role?: string,
    enabled?: string,
    sortBy?: string,
    sortDir: "asc" | "desc" = "desc",
    page = 1,
    pageSize = 20
): Promise<{ agents: Agent[]; totalPages: number; totalItems: number }> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (name) {
        conditions.push("agents.display_name LIKE ?");
        params.push(`%${name}%`);
    }

    if (email) {
        conditions.push("agents.email LIKE ?");
        params.push(`%${email}%`);
    }

    if (role) {
        conditions.push("agents.role = ?");
        params.push(role);
    }

    if (enabled === "true") {
        conditions.push("agents.deleted_at IS NULL");
    }

    if (enabled === "false") {
        conditions.push("agents.deleted_at IS NOT NULL");
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderClause = `ORDER BY agents.${sortBy} ${sortDir}`;

    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT * FROM agents
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
    `,
        [...params, pageSize, offset]
    );

    const [[{ total }]] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM agents ${whereClause}`, params);

    return {
        agents: rows as Agent[],
        totalItems: total,
        totalPages: Math.ceil(total / pageSize)
    }
}

export async function getAgentById(id: number): Promise<Agent | null> {
    const [rows] = await pool.query("SELECT * FROM agents WHERE id = ?", [id]);
    return (rows as any[])[0] || null;
}

export async function getAgentByEmail(email: string): Promise<Agent | null> {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM agents WHERE email = ?", [email]);
    
    if (rows.length === 0) {
        return null;
    }
    return rows[0] as Agent;
}

export async function createAgent(data: Partial<Agent>): Promise<Agent> {
    const { email, display_name, password, entra_object_id, role } = data;

    const hashedPassword = password ? await hash(password, 10) : null;

    const [result] = await pool.query("INSERT INTO agents (email, display_name, password, entra_object_id, role) VALUES (?, ?, ?, ?, ?)", [
        email, 
        display_name || null, 
        hashedPassword || null, 
        entra_object_id || null, 
        role
    ]);

    const [rows] = await pool.query("SELECT * FROM agents WHERE id = ?", [(result as any).insertId]);
    return rows[0] as Agent;
}

export async function softDeleteAgent(id: number): Promise<Agent | null> {
    await pool.query("UPDATE agents SET deleted_at = NOW() WHERE id = ?", [id]);
    return getAgentById(id);
}

export async function restoreAgent(id: number): Promise<Agent | null> {
    await pool.query("UPDATE agents SET deleted_at = NULL WHERE id = ?", [id]);
    return getAgentById(id);
}

export async function updateAgent(id: number, data: Partial<Agent>): Promise<Agent | null> {
    if (data.password) {
        data.password = await hash(data.password, 10);
    }
    const updatedRows = await updateById<Agent>("agents", id, data);

    if (!updatedRows) {
        return null;
    }
    return getAgentById(id);
}