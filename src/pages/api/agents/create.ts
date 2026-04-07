import { withApiHandler } from "../../../lib/api";
import { createAgent } from "../../../lib/repositories/agents";
import Joi from "joi";
import { Agent, AgentRole } from "@/lib/entities/Agent";
import { sanitize } from "@/lib/utils/sanitize";
import { createAuditLog } from "@/lib/repositories/auditLogs";
import { AuditAction } from "@/lib/entities/AuditLog";
import { CreateAgentAuditDetailsV1 } from "@/lib/entities/AuditLogDetails";

const agentSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "any.required": "Email address is required",
        "string.email": "Invalid email address"
    }),
    display_name: Joi.string().min(2).max(50).required().messages({
        "any.required": "Display name is required",
        "string.min": "Display name must be between 2 and 50 characters",
        "string.max": "Display name must be between 2 and 50 characters"
    }),
    password: Joi.string().min(6).optional().messages({
        "string.min": "Password must be at least 6 characters"
    }),
    entra_object_id: Joi.string().guid({ version: ["uuidv4"] }).optional().messages({
        "string.guid": "Entra Object ID must be a valid v4 UUID"
    }),
    role: Joi.string().valid(...Object.values(AgentRole)).required().messages({
        "any.required": "Role is required",
        "any.only": `Invalid role, must be one of ${Object.values(AgentRole).join(", ")}`
    })
});

export default withApiHandler(async (req, res, session) => {
    const { email, display_name, password, entra_object_id, role } = req.body;

    const agent: Agent = await createAgent({
        email, display_name, password, entra_object_id, role
    });

    await createAuditLog<CreateAgentAuditDetailsV1>({
        agent_id: session.agent.id,
        action: AuditAction.CREATE_AGENT,
        row_id: agent.id,
        details_version: 1,
        details: {
            display_name: agent.display_name,
            email: agent.email,
            role: agent.role
        }
    });

    res.status(201).json(sanitize(agent, ["password"]));
}, {
    methods: ["POST"],
    schema: agentSchema,
    requiredRole: AgentRole.ADMIN
});
