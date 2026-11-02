export interface Agent {
    id: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    email: string;
    password: string | null;
    display_name: string | null;
    entra_object_id: string | null;
    roles?: any[];
}

export enum AgentRole {
    VIEWER = "VIEWER",
    MANAGER = "MANAGER",
    ADMIN = "ADMIN"
}
