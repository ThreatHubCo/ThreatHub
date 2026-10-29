import { AgentPermission } from "@/lib/agents/permissions";
import { withApiHandler } from "@/lib/api";
import { AgentRole } from "@/lib/entities/Agent";
import { createRole, getAllRoles } from "@/lib/repositories/roles";
import Joi from "joi";

const permissionValues = Object.values(AgentPermission);

const schema = Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    summary: Joi.string().allow("", null).max(255).optional(),
    permissions: Joi.array()
        .items(Joi.string().valid(...permissionValues))
        .unique()
        .default([])
});

export default withApiHandler(async (req, res) => {
    switch (req.method) {
        case "GET": {
            const roles = await getAllRoles();
            return res.status(200).json(roles);
        }

        case "POST": {
            const body = req.body;

            const id = await createRole({
                name: body.name,
                summary: body.summary,
                permissions: body.permissions ?? []
            });

            return res.status(201).json({ id });
        }
    }
}, {
    methods: ["GET", "POST"],
    schema,
    authRequired: true,
    requiredRole: AgentRole.ADMIN
});