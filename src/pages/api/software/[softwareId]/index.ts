import { withApiHandler } from "@/lib/api";
import { AgentRole } from "@/lib/entities/Agent";
import { AuditAction } from "@/lib/entities/AuditLog";
import { UpdateSoftwareSettingsAuditDetailsV1 } from "@/lib/entities/AuditLogDetails";
import { createAuditLog } from "@/lib/repositories/auditLogs";
import { getSoftwareById, updateSoftware } from "@/lib/repositories/software";
import Joi from "joi";

const updateSchema = Joi.object({
    auto_ticket_escalation_enabled: Joi.boolean().required()
});

export default withApiHandler(async (req, res, session) => {
    const { softwareId } = req.query;

    const software = await getSoftwareById(Number(softwareId));
    if (!software) {
        return res.status(404).json({ error: "Software not found" });
    }

    if (req.method === "GET") {
        return res.json(software);
    }

    const updatedSoftware = await updateSoftware(Number(softwareId), {
        auto_ticket_escalation_enabled: req.body.auto_ticket_escalation_enabled
    });

    if (!updatedSoftware) {
        return res.status(400).json({ error: "Failed to update software settings" });
    }

    await createAuditLog<UpdateSoftwareSettingsAuditDetailsV1>({
        agent_id: session.agent.id,
        action: AuditAction.UPDATE_SOFTWARE_SETTINGS,
        row_id: software.id,
        details: {
            name: software.name,
            vendor: software.vendor,
            is_global: true,
            updates: [
                {
                    key: "auto_ticket_escalation_enabled",
                    old_value: Boolean(software.auto_ticket_escalation_enabled),
                    new_value: Boolean(req.body.auto_ticket_escalation_enabled)
                }
            ]
        }
    });

    return res.status(200).json(updatedSoftware);
}, {
    methods: ["POST"],
    schema: updateSchema,
    authRequired: true,
    requiredRole: AgentRole.MANAGER
});