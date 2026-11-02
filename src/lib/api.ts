import { getAuthOptions } from "@/pages/api/auth/[...nextauth]";
import Joi from "joi";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { AgentPermission } from "./agents/permissions";
import { ServerSession } from "./entities/Session";

type RequiredPermissions = | AgentPermission[] | Partial<Record<string, AgentPermission[]>>;

type HandlerOptions = {
    methods?: string[];
    authRequired?: boolean;
    schema?: Joi.ObjectSchema<any>;
    requiredPermissions?: RequiredPermissions;
}

export function withApiHandler(
    handler: (req: NextApiRequest, res: NextApiResponse, session?: any) => Promise<void>,
    options: HandlerOptions = {}
) {
    const {
        methods = ["GET"],
        authRequired = true,
        requiredPermissions,
        schema
    } = options;

    return async (req: NextApiRequest, res: NextApiResponse) => {
        if (!methods.includes(req.method || "")) {
            return res.status(405).json({ error: `Method ${req.method} not allowed` });
        }

        let session: ServerSession = null

        if (authRequired) {
            session = await getServerSession(req, res, await getAuthOptions());

            if (!session) {
                return res.status(401).json({ error: "Unauthorised" });
            }
            if (session.agent.deleted_at !== null) {
                return res.status(403).json({ error: "Account is disabled" });
            }

            // Permission-based authorization
            if (requiredPermissions) {
                const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : requiredPermissions[req.method || ""] || [];
                const hasPermission = permissions.some(permission => session.agent.permissions?.includes(permission));

                if (permissions.length > 0 && !hasPermission) {
                    return res.status(403).json({ error: "You do not have the required permissions" });
                }
            }
        }

        if (schema && (req.method === "POST" || req.method === "PUT")) {
            const { error } = schema.validate(req.body);

            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }
        }

        try {
            await handler(req, res, session);
        } catch (e: any) {
            console.error("API Error:", e);
            res.status(500).json({ error: e.message });
        }
    };
}
