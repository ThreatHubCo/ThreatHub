import { Customer } from "@/lib/entities/Customer";
import { createCustomer } from "@/lib/repositories/customers";
import Joi from "joi";
import { withApiHandler } from "../../../lib/api";
import { createAuditLog } from "@/lib/repositories/auditLogs";
import { AuditAction } from "@/lib/entities/AuditLog";
import { AgentRole } from "@/lib/entities/Agent";
import { CreateCustomerAuditDetailsV1 } from "@/lib/entities/AuditLogDetails";

export const customerSchema = Joi.object({
    name: Joi.string().min(2).max(255).required().messages({
        "any.required": "Name is required",
        "string.min": "Name must be at least 2 characters",
        "string.max": "Name must be between 2 and 255 characters"
    }),
    tenant_id: Joi.string().guid({ version: ["uuidv4"] }).optional().messages({
        "string.guid": "Tenant ID must be a v4 UUID",
    }),
    external_customer_id: Joi.string().optional(),
    supports_csp: Joi.boolean().optional()
});

export default withApiHandler(async (req, res, session) => {
    const {
        name,
        tenant_id,
        external_customer_id,
        supports_csp
    } = req.body;

    const customer: Customer = await createCustomer({
        name,
        tenant_id,
        external_customer_id,
        supports_csp
    });

    await createAuditLog<CreateCustomerAuditDetailsV1>({
        agent_id: session.agent.id,
        action: AuditAction.CREATE_CUSTOMER,
        customer_id: customer.id,
        details_version: 1,
        details: { 
            name: customer.name, 
            via_import: false 
        }
    });

    res.status(201).json(customer);
}, {
    methods: ["POST"],
    schema: customerSchema,
    requiredRole: AgentRole.MANAGER
});
