import { withApiHandler } from "@/lib/api";
import { AgentRole } from "@/lib/entities/Agent";
import { AuditAction } from "@/lib/entities/AuditLog";
import { createAuditLog } from "@/lib/repositories/auditLogs";
import { createCustomer } from "@/lib/repositories/customers";
import Joi from "joi";
import { customerSchema } from "./create";
import { CreateCustomerAuditDetailsV1 } from "@/lib/entities/AuditLogDetails";

export const schema = Joi.object({
    rows: Joi.array()
        .items(customerSchema)
        .min(1)
        .required()
        .messages({
            "any.required": "Invalid request",
            "any.min": "You must include at least 1 row in the CSV"
        })
}).custom((value, helpers) => {
    const seen = new Set<string>();

    for (const [index, row] of value.rows.entries()) {
        if (!row.tenant_id) {
            continue;
        }
        if (seen.has(row.tenant_id)) {
            return helpers.message({ custom: `Duplicate tenant_id '${row.tenant_id}' found for ${row.name} (row ${index + 1}) ` });
        }
        seen.add(row.tenant_id);
    }
    return value;
});

export default withApiHandler(async (req, res, session) => {
    const { rows } = req.body;
    const created = [];

    for (const data of rows) {
        const customer = await createCustomer(data);
        created.push(customer);

        await createAuditLog<CreateCustomerAuditDetailsV1>({
            agent_id: session.agent.id,
            action: AuditAction.CREATE_CUSTOMER,
            customer_id: customer.id,
            details_version: 1,
            details: { 
                name: customer.name, 
                via_import: true 
            }
        });
    }

    res.status(201).json({ created: created.length });
}, {
    methods: ["POST"],
    schema,
    requiredRole: AgentRole.MANAGER
});