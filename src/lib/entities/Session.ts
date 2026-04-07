import { Agent } from "./Agent";

export interface Session {
    data: {
        agent: Agent;
    }
    status: "loading" | "authenticated" | "unauthenticated";
}

export interface ServerSession {
    agent: Agent;
}