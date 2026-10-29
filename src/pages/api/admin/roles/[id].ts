import { withApiHandler } from "@/lib/api";
import { AgentRole } from "@/lib/entities/Agent";
import { AgentPermission } from "@/lib/agents/permissions";
import { deleteRole, getRoleById, updateRole } from "@/lib/repositories/roles";
import Joi from "joi";

const schema = Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    summary: Joi.string().allow("", null).max(255).optional(),
    permissions: Joi.array()
        .items(Joi.string().valid(...Object.values(AgentPermission)))
        .unique()
        .required()
});

export default withApiHandler(async (req, res) => {
    const id = Number(req.query.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: "Invalid role ID" });
    }

    switch (req.method) {
        case "GET": {
            const role = await getRoleById(id);

            if (!role) {
                return res.status(404).json({ error: "Role not found" });
            }
            
            res.status(200).json(role);
            return;
        }

        case "PUT": {
            const body = req.body;

            const updated = await updateRole(id, {
                name: body.name,
                summary: body.summary,
                permissions: body.permissions
            });

            if (!updated) {
                return res.status(404).json({ error: "Role not found" });
            }

            res.status(200).json(await getRoleById(id));
            return;
        }

        case "DELETE": {
            const deleted = await deleteRole(id);

            if (!deleted) {
                return res.status(404).json({ error: "Role not found" });
            }
            res.status(204).end();
            return;
        }
    }
}, {
    methods: ["GET", "PUT", "DELETE"],
    schema,
    authRequired: true,
    requiredRole: AgentRole.ADMIN
});