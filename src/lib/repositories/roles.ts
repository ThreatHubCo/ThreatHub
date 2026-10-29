import { pool } from "@/lib/mysql";
import { AgentPermission } from "@/lib/agents/permissions";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export interface Role {
    id: number;
    name: string;
    summary: string | null;
    created_at: string;
    updated_at: string;
    permissions: AgentPermission[];
}

interface RoleRow extends RowDataPacket {
    id: number;
    name: string;
    summary: string | null;
    created_at: string;
    updated_at: string;
    permissions: string | null;
}

export async function getAllRoles(): Promise<Role[]> {
    const [rows] = await pool.query<RoleRow[]>(`
        SELECT
            r.id,
            r.name,
            r.summary,
            r.created_at,
            r.updated_at,
            GROUP_CONCAT(rp.permission) AS permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON rp.role_id = r.id
        GROUP BY r.id, r.name, r.summary, r.created_at, r.updated_at
        ORDER BY r.name ASC
    `);

    return rows.map(row => ({
        ...row,
        permissions: row.permissions
            ? row.permissions.split(",") as AgentPermission[]
            : []
    }));
}

export async function getRoleById(id: number): Promise<Role | null> {
    const [rows] = await pool.query<RoleRow[]>(`
        SELECT
            r.id,
            r.name,
            r.summary,
            r.created_at,
            r.updated_at,
            GROUP_CONCAT(rp.permission) AS permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON rp.role_id = r.id
        WHERE r.id = ?
        GROUP BY r.id, r.name, r.summary, r.created_at, r.updated_at
    `, [id]);

    const row = rows[0];

    if (!row) return null;

    return {
        ...row,
        permissions: row.permissions ? row.permissions.split(",") as AgentPermission[] : []
    };
}

export async function createRole(data: {
    name: string;
    summary?: string | null;
    permissions: AgentPermission[];
}): Promise<number> {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.query<ResultSetHeader>(
            "INSERT INTO roles (name, summary) VALUES (?, ?)",
            [data.name, data.summary || null]
        );

        if (data.permissions.length > 0) {
            const values = data.permissions.map(permission => [result.insertId, permission]);

            await connection.query("INSERT INTO role_permissions (role_id, permission) VALUES ?", [values]);
        }

        await connection.commit();
        return result.insertId;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function updateRole(
    id: number,
    data: {
        name: string;
        summary?: string | null;
        permissions: AgentPermission[];
    }
): Promise<boolean> {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
            "UPDATE roles SET name = ?, summary = ? WHERE id = ?",
            [data.name, data.summary || null, id]
        );

        // Check whether the role exists, even if no fields changed.
        const [existing] = await connection.query<RowDataPacket[]>("SELECT id FROM roles WHERE id = ?", [id]);

        if (existing.length === 0) {
            await connection.rollback();
            return false;
        }

        await connection.query("DELETE FROM role_permissions WHERE role_id = ?", [id]);

        if (data.permissions.length > 0) {
            const values = data.permissions.map(permission => [id, permission]);

            await connection.query("INSERT INTO role_permissions (role_id, permission) VALUES ?", [values]);
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function deleteRole(id: number): Promise<boolean> {
    const [result] = await pool.query<any>("DELETE FROM roles WHERE id = ?", [id]);
    return result.affectedRows > 0;
}