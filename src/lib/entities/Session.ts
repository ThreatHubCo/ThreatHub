import { AgentPermission } from "../agents/permissions";
import { Agent } from "./Agent";

interface AgentWithPermissions extends Agent {
    permissions: AgentPermission[];
}

export interface Session {
    data: {
        agent: AgentWithPermissions;
    }
    status: "loading" | "authenticated" | "unauthenticated";
}

export interface ServerSession {
    agent: AgentWithPermissions;
}