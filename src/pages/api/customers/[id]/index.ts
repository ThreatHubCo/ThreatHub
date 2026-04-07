import { withApiHandler } from "@/lib/api";
import { AgentRole } from "@/lib/entities/Agent";
import { AuditAction } from "@/lib/entities/AuditLog";
import { createAuditLog } from "@/lib/repositories/auditLogs";
import { getCustomerById, updateCustomer } from "@/lib/repositories/customers";
import Joi from "joi";

const updateSchema = Joi.object({
    name: Joi.string().min(2).max(255).required().messages({
        "any.required": "Name is required",
        "string.min": "Name must be at least 2 characters",
        "string.max": "Name must be between 2 and 255 characters"
    }),
    tenant_id: Joi.string().guid({ version: ["uuidv4"] }).optional().messages({
        "string.guid": "Tenant ID must be a v4 UUID",
    }),
    external_customer_id: Joi.string().optional(),
    disabled: Joi.boolean().optional(),
    supports_csp: Joi.boolean().optional()
});

export default withApiHandler(async (req, res, session) => {
    const { id } = req.query;
    const customerId = Number(id);

    const customer = await getCustomerById(customerId);
    if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
    }

    if (req.method === "GET") {
        return res.json(customer);
    }

    const newCustomer = await updateCustomer(customerId, req.body);

    if (!newCustomer) {
        return res.status(404).json({ error: "Failed to update customer" });
    }

    await createAuditLog({
        agent_id: session.agent.id,
        action: AuditAction.UPDATE_CUSTOMER,
        customer_id: customer.id,
        details: {} // TODO: Include the changes between the two versions
    });

    return res.status(200).json(customer);
}, {
    methods: ["GET", "PUT"],
    schema: updateSchema,
    authRequired: true,
    requiredRole: AgentRole.MANAGER
});
