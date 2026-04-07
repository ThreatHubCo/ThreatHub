import { AgentRole } from "@/lib/entities/Agent";
import { AuditAction } from "@/lib/entities/AuditLog";
import { DisableCustomerAuditDetailsV1 } from "@/lib/entities/AuditLogDetails";
import { createAuditLog } from "@/lib/repositories/auditLogs";
import { softDeleteCustomer } from "@/lib/repositories/customers";
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

    const customer = await softDeleteCustomer(Number(id));
    if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
    }

    await createAuditLog<DisableCustomerAuditDetailsV1>({
        agent_id: session.agent.id,
        customer_id: customer.id,
        action: AuditAction.DISABLE_CUSTOMER,
        row_id: customer.id,
        details_version: 1,
        details: {
            name: customer.name,
            reason
        }
    });
    res.status(201).json(customer);
}, {
    methods: ["POST"],
    schema: disableSchema,
    requiredRole: AgentRole.MANAGER
});
