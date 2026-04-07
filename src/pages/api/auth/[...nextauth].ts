import { getAgentByEmail } from "@/lib/repositories/agents";
import { sanitize } from "@/lib/utils/sanitize";
import NextAuth, { SessionStrategy } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import MicrosoftEntraProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { getAllConfig } from "@/lib/repositories/config";
import { compare } from "bcrypt";
import { createAuditLog } from "@/lib/repositories/auditLogs";
import { AgentLoginAuditDetailsV1 } from "@/lib/entities/AuditLogDetails";
import { AuditAction } from "@/lib/entities/AuditLog";

export async function getAuthOptions() {
    const config = await getAllConfig();

    return {
        providers: [
            CredentialsProvider({
                name: "Credentials",
                credentials: {
                    email: { label: "Email", type: "email" },
                    password: { label: "Password", type: "password" }
                },
                async authorize(credentials): Promise<any> {
                    if (!config.ENABLE_PASSWORD_AUTH) {
                        throw new Error("Email & password authentication is disabled in the config");
                    }
                    if (!credentials.email || !credentials.password) {
                        throw new Error("Failed to login");
                    }

                    const agent = await getAgentByEmail(credentials.email);

                    if (!agent) {
                        throw new Error("Account doesn't exist");
                    }

                    const validPassword = await compare(credentials.password, agent.password);

                    if (!validPassword) {
                        throw new Error("Incorrect password");
                    }
                    if (agent.deleted_at) {
                        throw new Error("Account is disabled");
                    }
                    return sanitize(agent, ["password"]);
                }
            }),
            MicrosoftEntraProvider({
                clientId: config.ENTRA_AUTH_CLIENT_ID,
                clientSecret: config.ENTRA_AUTH_CLIENT_SECRET,
                tenantId: config.HOME_TENANT_ID
            })
        ],
        callbacks: {
            async signIn({ user, account, profile }) {
                if (account.provider === "azure-ad") {
                    if (!config.ENABLE_MICROSOFT_AUTH) {
                        throw new Error("Microsoft authentication is disabled");
                    }
                    if (profile.tid !== config.HOME_TENANT_ID) {
                        throw new Error("Invalid tenant");
                    }
                    // Object ID - profile.oid
                }

                const agent = await getAgentByEmail(user.email);

                if (!agent) {
                    throw new Error("Account doesn't exist");
                }

                if (agent.deleted_at) {
                    throw new Error("Account is disabled");
                }

                await createAuditLog<AgentLoginAuditDetailsV1>({
                    agent_id: agent.id,
                    action: AuditAction.LOGIN,
                    row_id: agent.id,
                    details_version: 1,
                    details: {
                        display_name: agent.display_name,
                        email: agent.email,
                        method: account.provider === "azure-ad" ? "microsoft": "credentials"
                    }
                });

                return true;
            },
            async session({ session, token, user }) {
                const agent = await getAgentByEmail(session.user.email);

                if (!agent || agent.deleted_at) {
                    return null;
                }
                session.agent = sanitize(agent, ["password"]);
                return session;
            },
            async jwt({ token, user }) {
                if (user) {
                    const agent = await getAgentByEmail(user.email);
                    if (agent) {
                        token.id = agent.id;
                    }
                }
                return token;
            }
        },
        session: {
            strategy: "jwt" as SessionStrategy
        },
        pages: {
            signIn: "/login",
            error: "/login"
        }
    }
}

export default async function auth(req, res) {
    return NextAuth(req, res, await getAuthOptions());
}