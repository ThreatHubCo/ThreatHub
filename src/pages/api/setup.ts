import { withApiHandler } from "@/lib/api";
import { pool } from "@/lib/mysql";
import Joi from "joi";
import { createAgent } from "@/lib/repositories/agents";
import { sanitize } from "@/lib/utils/sanitize";
import { createAuditLog } from "@/lib/repositories/auditLogs";
import { AgentRole } from "@/lib/entities/Agent";
import { AuditAction } from "@/lib/entities/AuditLog";
import { CreateAgentAuditDetailsV1 } from "@/lib/entities/AuditLogDetails";

const setupSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "any.required": "Email address is required",
        "string.email": "Invalid email address"
    }),
    password: Joi.string().min(10).required().messages({
        "any.required": "Password is required",
        "string.min": "Password must be at least 10 characters"
    })
});

export default withApiHandler(async (req, res) => {
    if (req.method === "GET") {
        try {
            const [rows] = await pool.query<any>("SELECT id FROM agents LIMIT 1");
            const hasAgents = rows.length > 0;

            return res.status(200).json({
                mysqlOnline: true,
                hasAgents
            });
        } catch (error) {
            console.error("MySQL check failed:", error);
            return res.status(500).json({
                mysqlOnline: false,
                hasAgents: false,
            });
        }
    }

    if (req.method === "POST") {
        try {
            const { error, value } = setupSchema.validate(req.body);

            if (error) {
                return res.status(400).json({ error: error.message });
            }

            const [existingAgents] = await pool.query<any>("SELECT id FROM agents LIMIT 1");

            if (existingAgents.length > 0) {
                return res.status(400).json({ error: "Setup has already been completed" });
            }

            const { email, password } = value;

            const agent = await createAgent({
                email,
                display_name: "Admin",
                password,
                role: AgentRole.ADMIN
            });

            await createAuditLog<CreateAgentAuditDetailsV1>({
                action: AuditAction.CREATE_AGENT,
                row_id: agent.id,
                details_version: 1,
                details: {
                    display_name: agent.display_name,
                    email: agent.email,
                    role: agent.role
                }
            });

            return res.status(201).json(sanitize(agent, ["password"]));
        } catch (err) {
            console.error("Failed to create admin agent:", err);
            return res.status(500).json({ error: "Failed to create admin agent" });
        }
    }

    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}, {
    methods: ["GET", "POST"],
    authRequired: false
});