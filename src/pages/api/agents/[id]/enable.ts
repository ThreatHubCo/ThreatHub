import { AgentRole } from "@/lib/entities/Agent";
import { AuditAction } from "@/lib/entities/AuditLog";
import { createAuditLog } from "@/lib/repositories/auditLogs";
import { restoreAgent } from "@/lib/repositories/agents";
import { withApiHandler } from "../../../../lib/api";
import { sanitize } from "@/lib/utils/sanitize";
import { EnableAgentAuditDetailsV1 } from "@/lib/entities/AuditLogDetails";

export default withApiHandler(async (req, res, session) => {
    const { id } = req.query;

    const agent = await restoreAgent(Number(id));
    if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
    }

    await createAuditLog<EnableAgentAuditDetailsV1>({
        agent_id: session.agent.id,
        action: AuditAction.ENABLE_AGENT,
        row_id: agent.id,
        details_version: 1,
        details: {
            display_name: agent.display_name,
            email: agent.email
        }
    });

    res.status(200).json(sanitize(agent, ["password"]));
}, {
    methods: ["POST"],
    requiredRole: AgentRole.ADMIN
});
