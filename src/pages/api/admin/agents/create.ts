import { AgentPermission } from "@/lib/agents/permissions";
import { Agent } from "@/lib/entities/Agent";
import { AuditAction } from "@/lib/entities/AuditLog";
import { CreateAgentAuditDetailsV1 } from "@/lib/entities/AuditLogDetails";
import { createAuditLog } from "@/lib/repositories/auditLogs";
import { sanitize } from "@/lib/utils/sanitize";
import Joi from "joi";
import { withApiHandler } from "../../../../lib/api";
import { createAgent } from "../../../../lib/repositories/agents";

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
    roles: Joi.array()
        .items(Joi.number().integer().positive())
        .min(1)
        .unique()
        .required()
        .messages({
            "any.required": "At least one role is required",
            "array.min": "At least one role must be selected",
            "array.unique": "Duplicate roles are not allowed"
        })
});

export default withApiHandler(async (req, res, session) => {
    const { email, display_name, password, entra_object_id, roles } = req.body;

    const agent: Agent = await createAgent({
        email, display_name, password, entra_object_id, roles
    });

    await createAuditLog<CreateAgentAuditDetailsV1>({
        agent_id: session.agent.id,
        action: AuditAction.CREATE_AGENT,
        row_id: agent.id,
        details_version: 1,
        details: {
            display_name: agent.display_name,
            email: agent.email,
            roles
        }
    });

    res.status(201).json(sanitize(agent, ["password"]));
}, {
    methods: ["POST"],
    schema: agentSchema,
    requiredPermissions: [AgentPermission.ADMIN_AGENTS_MODIFY]
});
