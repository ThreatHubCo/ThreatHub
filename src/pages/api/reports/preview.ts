import { withApiHandler } from "@/lib/api";
import { AgentRole } from "@/lib/entities/Agent";
import { reportPool } from "@/lib/mysql";
import { basicSqlQueryValidation } from "@/lib/utils/utils";

export default withApiHandler(async (req, res) => {
    const { sql } = req.body;

    if (!sql || typeof sql !== "string") {
        return res.status(400).json({ error: "SQL query is required" });
    }

    try {
        basicSqlQueryValidation(sql);
    } catch (e) {
        return res.status(400).json({ error: e.message });
    }

    try {
        const [rows] = await reportPool.execute(sql.trim());

        res.status(200).json({ rows });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}, {
    methods: ["POST"],
    authRequired: true,
    requiredRole: AgentRole.ADMIN
});