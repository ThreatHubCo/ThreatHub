import { AgentPermission } from "@/lib/agents/permissions";
import { AuditAction } from "@/lib/entities/AuditLog";
import { EnableAgentAuditDetailsV1 } from "@/lib/entities/AuditLogDetails";
import { restoreAgent } from "@/lib/repositories/agents";
import { createAuditLog } from "@/lib/repositories/auditLogs";
import { sanitize } from "@/lib/utils/sanitize";
import { withApiHandler } from "../../../../../lib/api";

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
    requiredPermissions: [AgentPermission.ADMIN_AGENTS_MODIFY]
});
