import { getAuthOptions } from "@/pages/api/auth/[...nextauth]";
import Joi from "joi";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { AgentRole } from "./entities/Agent";
import { ServerSession } from "./entities/Session";

type HandlerOptions = {
    methods?: string[];
    authRequired?: boolean;
    schema?: Joi.ObjectSchema<any>;
    requiredRole?: AgentRole;
}

export const roleToInt = {
    [AgentRole.VIEWER]: 0,
    [AgentRole.MANAGER]: 10,
    [AgentRole.ADMIN]: 20
}

export function withApiHandler(
    handler: (req: NextApiRequest, res: NextApiResponse, session?: any) => Promise<void>,
    options: HandlerOptions = {}
) {
    const { 
        methods = ["GET"], 
        authRequired = true, 
        requiredRole = AgentRole.VIEWER, 
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

            const currentRoleInt = roleToInt[session.agent.role];
            const targetRoleInt = roleToInt[requiredRole];

            if (!session.agent || !session?.agent?.role || currentRoleInt < targetRoleInt) {
                return res.status(403).json({ error: "You are not authorised to perform this action" });
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
            res.status(500).json({ error: "Internal server error" });
        }
    };
}
