import { AgentRole } from "@/lib/entities/Agent";
import { getAgentById, updateAgent } from "@/lib/repositories/agents";
import { sanitize } from "@/lib/utils/sanitize";
import { withApiHandler } from "../../../../lib/api";

export default withApiHandler(async (req, res, session) => {
    const { id } = req.query;

    const agent = await getAgentById(Number(id));
    if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
    }

    // Remove password
    await updateAgent(Number(id), { password: null });

    // TODO: Audit logging

    res.status(200).json(sanitize(agent, ["password"]));
}, {
    methods: ["PUT"],
    requiredRole: AgentRole.ADMIN
});
