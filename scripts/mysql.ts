import mysql from "mysql2/promise";

/**
 * Create a pool here allowing multiple statements. We don't want to enable this on the main
 * pool because it increases the risk of SQL injection attacks.
 */
export const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT),
    multipleStatements: true
});