import { roleToInt, withApiHandler } from "@/lib/api";
import { ConfigKey } from "@/lib/entities/Config";
import { getAllConfig } from "@/lib/repositories/config";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "./auth/[...nextauth]";

export default withApiHandler(async (req, res, _) => {
    const session = await getServerSession(req, res, await getAuthOptions());
    const config = await getAllConfig();

    // If the user is logged out then only return a basic config for the login page to function
    if (!session) {
        return res.json({
            [ConfigKey.ENABLE_MICROSOFT_AUTH]: config.ENABLE_MICROSOFT_AUTH,
            [ConfigKey.ENABLE_PASSWORD_AUTH]: config.ENABLE_PASSWORD_AUTH
        });
    }

    if (session.agent.deleted_at !== null) {
        return res.status(403).json({ error: "Account is disabled" });
    }

    return res.json({
        ...config,
        [ConfigKey.TICKET_SYSTEM_CLIENT_ID]: undefined,
        [ConfigKey.TICKET_SYSTEM_CLIENT_SECRET]: undefined,
        [ConfigKey.ENTRA_AUTH_CLIENT_ID]: undefined,
        [ConfigKey.ENTRA_AUTH_CLIENT_SECRET]: undefined,
        [ConfigKey.ENTRA_BACKEND_CLIENT_ID]: undefined,
        [ConfigKey.ENTRA_BACKEND_CLIENT_SECRET]: undefined
    });
}, {
    methods: ["GET"],
    authRequired: false
});
