import mysql, { Pool } from "mysql2/promise";

if (!global.mysqlPool) {
    global.mysqlPool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        port: Number(process.env.MYSQL_PORT)
    });
}

export const pool: Pool = global.mysqlPool;

if (!global.reportMysqlPool) {
    global.reportMysqlPool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_REPORT_USER,
        password: process.env.MYSQL_REPORT_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        port: Number(process.env.MYSQL_PORT)
    });
}

export const reportPool: Pool = global.reportMysqlPool;

export async function updateById<T extends object>(
    table: string,
    id: number,
    data: Partial<T>,
    idColumn: string = "id"
): Promise<number> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
    });

    if (!fields.length) return 0;

    values.push(id);

    const [result] = await pool.query(
        `UPDATE \`${table}\` SET ${fields.join(", ")} WHERE \`${idColumn}\` = ?`,
        values
    );

    return (result as any).affectedRows || 0;
}