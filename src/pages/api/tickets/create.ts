import { vulnTicketTemplate } from "@/data/vuln-ticket-template";
import { withApiHandler } from "@/lib/api";
import { AuditAction } from "@/lib/entities/AuditLog";
import { CreateTicketAuditDetailsV1 } from "@/lib/entities/AuditLogDetails";
import { RemediationTicketStatus } from "@/lib/entities/RemediationTicket";
import { createAuditLog } from "@/lib/repositories/auditLogs";
import { getCustomerById } from "@/lib/repositories/customers";
import { createRemediationTicket } from "@/lib/repositories/remediations";
import { getSoftwareById, getSoftwareByIdWithStats } from "@/lib/repositories/software";
import { getTicketSystem } from "@/lib/ticketing/factory";
import Joi from "joi";

const ticketSchema = Joi.object({
    subject: Joi.string().required().messages({
        "any.required": "Subject is required"
    }),
    description: Joi.string().required().messages({
        "any.required": "Description is required"
    }),
    customerId: Joi.number().required(),
    softwareId: Joi.number().required()
});

export default withApiHandler(async (req, res, session) => {
    const creator_agent_id = session?.agent?.id;
    const customer = await getCustomerById(req.body.customerId);

    if (!customer) {
        return res.status(404).json({ error: "Invalid customer" });
    }

    const software = await getSoftwareByIdWithStats(req.body.softwareId);

    if (!software) {
        return res.status(404).json({ error: "Invalid software" });
    }

    const ticketSystem = await getTicketSystem();

    const body = vulnTicketTemplate(
        req.body.subject,
        req.body.description.replace(/\n/g, "<br>"),
        software,
        customer,
        session.agent
    );

    const minified = body
        .replace(/\n/g, "")
        .replace(/\s+/g, " ")
        .trim();

    let externalTicketId = await ticketSystem.createTicket(customer, req.body.subject, minified);

    await createRemediationTicket({
        customer_id: customer.id,
        software_id: req.body.softwareId,
        external_ticket_id: externalTicketId,
        opened_by_agent_id: creator_agent_id,
        status: RemediationTicketStatus.OPEN
    });

    await createAuditLog<CreateTicketAuditDetailsV1>({
        agent_id: creator_agent_id,
        customer_id: req.body.customerId || undefined,
        action: AuditAction.CREATE_TICKET,
        details_version: 1,
        details: {
            external_ticket_id: externalTicketId,
            subject: req.body.subject,
            description: req.body.description
        }
    });

    res.status(201).json({ externalTicketId });
}, {
    methods: ["POST"],
    schema: ticketSchema,
    authRequired: true
});
