import { AgentRole } from "@/lib/entities/Agent";
import { AuditAction } from "@/lib/entities/AuditLog";
import { createAuditLog } from "@/lib/repositories/auditLogs";
import { restoreCustomer } from "@/lib/repositories/customers";
import { withApiHandler } from "../../../../lib/api";

export default withApiHandler(async (req, res, session) => {
    const { id } = req.query;

    const customer = await restoreCustomer(Number(id));
    if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
    }

    await createAuditLog({
        agent_id: session.agent.id,
        customer_id: customer.id,
        action: AuditAction.ENABLE_CUSTOMER,
        row_id: customer.id,
        details_version: 1,
        details: {
            name: customer.name
        }
    });

    res.status(200).json(customer);
}, {
    methods: ["POST"],
    requiredRole: AgentRole.MANAGER
});
