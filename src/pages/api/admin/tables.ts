import { withApiHandler } from "@/lib/api";
import { AgentRole } from "@/lib/entities/Agent";
import { pool } from "@/lib/mysql";

export default withApiHandler(async (req, res) => {
    const tableNames = await pool.execute(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
        ORDER BY table_name;
    `);

    const tables = await Promise.all(
        (tableNames as any[])[0].map(async (row) => {
            const tableName = row.TABLE_NAME;

            const [countRows] = await pool.execute(
                `SELECT COUNT(*) as count FROM \`${tableName}\``
            );

            return {
                name: tableName,
                rows: countRows[0].count
            }
        })
    );

    res.status(200).json({
        tables
    });
}, {
    methods: ["GET"],
    authRequired: true,
    requiredRole: AgentRole.ADMIN
});