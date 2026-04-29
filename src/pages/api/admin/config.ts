import { withApiHandler } from "@/lib/api";
import { DEFAULT_CONFIG } from "@/lib/config/configDefaults";
import { AgentRole } from "@/lib/entities/Agent";
import { AuditAction } from "@/lib/entities/AuditLog";
import { UpdateConfigAuditDetailsV1 } from "@/lib/entities/AuditLogDetails";
import { ConfigKey } from "@/lib/entities/Config";
import { createAuditLog } from "@/lib/repositories/auditLogs";
import { getAllConfig, updateConfig } from "@/lib/repositories/config";
import Joi from "joi";

const schemaKeys = Object.keys(DEFAULT_CONFIG).reduce((acc, key) => {
    const type = DEFAULT_CONFIG[key].type;
    
    switch (type) {
        case "boolean":
            acc[key] = Joi.boolean().optional();
            break;
        case "number":
            acc[key] = Joi.number().optional();
            break;
        case "string":
        default:
            acc[key] = Joi.string().allow("").optional();
    }
    return acc;
}, {} as Record<string, any>);

const schema = Joi.object(schemaKeys);

export default withApiHandler(async (req, res, session) => {
    switch (req.method) {
        case "GET": {
            const config = await getAllConfig();
            return res.status(200).json(config);
        }
        case "PUT": {
            const currentConfig = await getAllConfig();
            const updates = req.body;

            const changedKeys = Object.keys(updates).filter(
                key => currentConfig[key] !== updates[key]
            );

            if (changedKeys.includes(ConfigKey.INSTANCE_ID)) {
                return res.status(400).json({ error: "Instance ID cannot be changed" });
            }

            const updated = await updateConfig(updates);

            if (changedKeys.length > 0) {
                await createAuditLog<UpdateConfigAuditDetailsV1>({
                    agent_id: session.agent.id,
                    action: AuditAction.UPDATE_CONFIG,
                    details_version: 1,
                    details: { 
                        keys: changedKeys 
                    }
                });
            }

            return res.status(200).json(updated);
        }
    }
}, {
    methods: ["GET", "PUT"],
    schema,
    authRequired: true,
    requiredRole: AgentRole.ADMIN
});
