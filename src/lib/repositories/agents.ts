import { hash } from "bcrypt";
import { RowDataPacket } from "mysql2";
import { Agent } from "../entities/Agent";
import { pool } from "../mysql";
import { WhereBuilder } from "../mysql/filters";


export async function getAllAgents(
    name?: string,
    email?: string,
    role?: number,
    enabled?: string,
    sortBy?: string,
    sortDir: "asc" | "desc" = "desc",
    page = 1,
    pageSize = 20
): Promise<{
    agents: any[];
    totalPages: number;
    totalItems: number;
}> {
    const where = new WhereBuilder()
        .like("agents.display_name", name)
        .like("agents.email", email)
        .addIf(
            !!role,
            `EXISTS (
                SELECT 1
                FROM agent_roles ar
                WHERE ar.agent_id = agents.id
                AND ar.role_id = ?
            )`,
            role
        )
        .addIf(enabled === "true", "agents.deleted_at IS NULL")
        .addIf(enabled === "false", "agents.deleted_at IS NOT NULL");

    const { sql: whereClause, params } = where.build();

    const orderClause = `ORDER BY agents.${sortBy} ${sortDir}`;
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query<any[]>(`
        SELECT * FROM agents
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    const [[{ total }]] = await pool.query<any[]>(
        `SELECT COUNT(*) AS total FROM agents ${whereClause}`,
        params
    );

    const agents = rows as any[];

    if (agents.length > 0) {
        const agentIds = agents.map(agent => agent.id);

        const [roleRows] = await pool.query<any[]>(`
            SELECT
                ar.agent_id,
                r.id,
                r.name
            FROM agent_roles ar
            INNER JOIN roles r ON r.id = ar.role_id
            WHERE ar.agent_id IN (?)
            ORDER BY r.name ASC
        `, [agentIds]);

        const rolesByAgent = new Map<number, { id: number; name: string }[]>();

        for (const row of roleRows) {
            const existing = rolesByAgent.get(row.agent_id) ?? [];

            existing.push({
                id: row.id,
                name: row.name
            });

            rolesByAgent.set(row.agent_id, existing);
        }

        for (const agent of agents) {
            agent.roles = rolesByAgent.get(agent.id) ?? [];
        }
    }

    return {
        agents,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize)
    }
}

export async function getAgentById(id: number): Promise<Agent | null> {
    const [rows] = await pool.query(
        `SELECT
            a.*,
            COALESCE(
                JSON_ARRAYAGG(ar.role_id),
                JSON_ARRAY()
            ) AS roles
        FROM agents a
        LEFT JOIN agent_roles ar ON ar.agent_id = a.id
        WHERE a.id = ?
        GROUP BY a.id`,
        [id]
    );

    const agent = (rows as any[])[0];

    if (!agent) {
        return null;
    }

    agent.roles = (agent.roles ?? []).filter(
        (roleId: number | null) => roleId !== null
    ).map(Number);

    return agent as Agent;
}

export async function getAgentByEmail(email: string): Promise<Agent | null> {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM agents WHERE email = ?", [email]);

    if (rows.length === 0) {
        return null;
    }
    return rows[0] as Agent;
}

interface CreateAgentData {
    email: string;
    display_name: string;
    password?: string;
    entra_object_id?: string;
    roles?: number[];
}

export async function createAgent(data: CreateAgentData): Promise<Agent> {
    const { email, display_name, password, entra_object_id, roles = [] } = data;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        if (roles.length) {
            const [roleRows] = await connection.query("SELECT id FROM roles WHERE id IN (?)", [roles]);

            if ((roleRows as any[]).length !== roles.length) {
                throw new Error("One or more selected roles do not exist");
            }
        }

        const hashedPassword = password ? await hash(password, 10) : null;

        const [result] = await connection.query(
            `INSERT INTO agents (email, display_name, password, entra_object_id) VALUES (?, ?, ?, ?)`,
            [
                email,
                display_name || null,
                hashedPassword,
                entra_object_id || null
            ]
        );

        const agentId = (result as any).insertId;

        if (roles.length) {
            await connection.query(`INSERT INTO agent_roles (agent_id, role_id) VALUES ?`,
                [roles.map(roleId => [agentId, roleId])]
            );
        }

        const [rows] = await connection.query("SELECT * FROM agents WHERE id = ?", [agentId]);

        await connection.commit();

        return {
            ...(rows as any[])[0],
            roles
        } as Agent;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function softDeleteAgent(id: number): Promise<Agent | null> {
    await pool.query("UPDATE agents SET deleted_at = NOW() WHERE id = ?", [id]);
    return getAgentById(id);
}

export async function restoreAgent(id: number): Promise<Agent | null> {
    await pool.query("UPDATE agents SET deleted_at = NULL WHERE id = ?", [id]);
    return getAgentById(id);
}

export async function updateAgent(id: number, data: any): Promise<Agent | null> {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { roles, password, ...agentData } = data;

        if (password) {
            agentData.password = await hash(password, 10);
        }

        if (Object.keys(agentData).length > 0) {
            const fields = Object.keys(agentData);

            const values = Object.values(agentData);

            await connection.query(
                `UPDATE agents SET ${fields.map(field => `\`${field}\` = ?`).join(", ")} WHERE id = ?`,
                [...values, id]
            );
        }

        if (roles !== undefined) {
            const [roleRows] = await connection.query("SELECT id FROM roles WHERE id IN (?)", [roles]);

            if ((roleRows as any[]).length !== roles.length) {
                throw new Error("One or more selected roles do not exist");
            }

            await connection.query("DELETE FROM agent_roles WHERE agent_id = ?", [id]);

            await connection.query(`INSERT INTO agent_roles (agent_id, role_id) VALUES ?`,
                [roles.map(roleId => [id, roleId])]
            );
        }

        await connection.commit();

        return getAgentById(id);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}