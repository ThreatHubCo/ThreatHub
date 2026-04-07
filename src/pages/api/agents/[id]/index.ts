import { withApiHandler } from "@/lib/api";
import { AgentRole } from "@/lib/entities/Agent";
import { AuditAction } from "@/lib/entities/AuditLog";
import { UpdateAgentAuditDetailsV1 } from "@/lib/entities/AuditLogDetails";
import { getAgentById, updateAgent } from "@/lib/repositories/agents";
import { createAuditLog } from "@/lib/repositories/auditLogs";
import { sanitize } from "@/lib/utils/sanitize";
import Joi from "joi";

const updateSchema = Joi.object({
    email: Joi.string().max(255).email().required().messages({
        "any.required": "Email address is required",
        "string.email": "Invalid email address",
        "string.max": "Email address must be less than 255 characters"
    }),
    display_name: Joi.string().min(2).max(50).required().messages({
        "any.required": "Display name is required",
        "string.min": "Display name must be between 2 and 50 characters",
        "string.max": "Display name must be between 2 and 50 characters"
    }),
    password: Joi.string().min(6).max(255).optional().messages({
        "string.min": "Password must be at least 6 characters",
        "string.max": "Password is too long"
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
    const { id } = req.query;
    const agent = await getAgentById(Number(id));

    if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
    }

    if (req.method === "GET") {
        return res.status(200).json(sanitize(agent, ["password"]));
    }

    const changedFields: Record<string, { before: any; after: any }> = {};

    for (const key of Object.keys(req.body)) {
        const oldValue: any = agent[key as keyof typeof agent];
        const newValue = req.body[key as keyof typeof req.body];

        if (key === "password") {
            continue;
        }

        if (
            (oldValue instanceof Date && newValue instanceof Date
                ? oldValue.getTime() !== newValue.getTime()
                : oldValue !== newValue)
        ) {
            changedFields[key] = { before: oldValue, after: newValue };
        }
    }

    const updatedAgent = await updateAgent(Number(id), req.body);

    await createAuditLog<UpdateAgentAuditDetailsV1>({
        agent_id: session.agent.id,
        action: AuditAction.UPDATE_AGENT,
        row_id: updatedAgent.id,
        details_version: 1,
        details: {
            fields: changedFields
        }
    });

    return res.status(200).json(sanitize(updatedAgent, ["password"]));
}, {
    methods: ["GET", "PUT"],
    schema: updateSchema,
    requiredRole: AgentRole.ADMIN
});
