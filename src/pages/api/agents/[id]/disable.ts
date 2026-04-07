import { AgentRole } from "@/lib/entities/Agent";
import { AuditAction } from "@/lib/entities/AuditLog";
import { DisableAgentAuditDetailsV1 } from "@/lib/entities/AuditLogDetails";
import { softDeleteAgent } from "@/lib/repositories/agents";
import { createAuditLog } from "@/lib/repositories/auditLogs";
import { sanitize } from "@/lib/utils/sanitize";
import Joi from "joi";
import { withApiHandler } from "../../../../lib/api";

const disableSchema = Joi.object({
    reason: Joi.string().min(5).max(200).required().messages({
        "any.required": "Reason is required",
        "string.min": "Reason must be at least 5 characters",
        "string.max": "Reason must be between 5 and 200 characters"
    })
});

export default withApiHandler(async (req, res, session) => {
    const { reason } = req.body;
    const { id } = req.query;

    const agent = await softDeleteAgent(Number(id));
    
    if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
    }

    await createAuditLog<DisableAgentAuditDetailsV1>({
        agent_id: session.agent.id,
        action: AuditAction.DISABLE_AGENT,
        row_id: agent.id,
        details_version: 1,
        details: {
            display_name: agent.display_name,
            email: agent.email,
            reason
        }
    });

    res.status(201).json(sanitize(agent, ["password"]));
}, {
    methods: ["POST"],
    schema: disableSchema,
    requiredRole: AgentRole.ADMIN
});
