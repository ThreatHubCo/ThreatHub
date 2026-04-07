export interface Agent {
    id: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    email: string;
    password: string | null;
    display_name: string | null;
    entra_object_id: string | null;
    role: AgentRole;
}

export enum AgentRole {
    VIEWER = "VIEWER",
    MANAGER = "MANAGER",
    ADMIN = "ADMIN"
}

export function formatAgentRole(role: AgentRole) {
    switch (role) {
        case AgentRole.VIEWER: return "Viewer";
        case AgentRole.MANAGER: return "Lead Technician";
        case AgentRole.ADMIN: return "Admin";
    }
}