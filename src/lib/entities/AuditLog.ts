export interface AuditLog<T = unknown> {
    id: number;
    created_at: string;
    agent_id: number | null;
    customer_id: number | null;
    action: AuditAction | null;
    row_id: number | null;
    details_version: number;
    details: T | null;   
    agent_name?: T | null;
    customer_name?: string | null;
}

export enum AuditAction {
    CREATE_TICKET = "CREATE_TICKET",

    CREATE_CUSTOMER = "CREATE_CUSTOMER",
    UPDATE_CUSTOMER = "UPDATE_CUSTOMER",
    DISABLE_CUSTOMER = "DISABLE_CUSTOMER",
    DELETE_CUSTOMER = "DELETE_CUSTOMER",
    ENABLE_CUSTOMER = "ENABLE_CUSTOMER",

    CREATE_AGENT = "CREATE_AGENT",
    UPDATE_AGENT = "UPDATE_AGENT",
    DISABLE_AGENT = "DISABLE_AGENT",
    DELETE_AGENT = "DELETE_AGENT",
    ENABLE_AGENT = "ENABLE_AGENT",

    LOGIN = "LOGIN",

    UPDATE_CONFIG = "UPDATE_CONFIG",
    UPDATE_SOFTWARE_SETTINGS = "UPDATE_SOFTWARE_SETTINGS",

    EXPORT_TABLE = "EXPORT_TABLE",
    
    CREATE_REPORT = "CREATE_REPORT",
    UPDATE_REPORT = "UPDATE_REPORT",
    EXECUTE_REPORT = "EXECUTE_REPORT",
    DELETE_REPORT = "DELETE_REPORT"
}

export function formatAuditActionName(action: AuditAction) {
    switch (action) {
        case AuditAction.CREATE_TICKET: return "Create Ticket";

        case AuditAction.CREATE_CUSTOMER: return "Create Customer";
        case AuditAction.UPDATE_CUSTOMER: return "Update Customer";
        case AuditAction.DISABLE_CUSTOMER: return "Disable Customer";
        case AuditAction.DELETE_CUSTOMER: return "Delete Customer";
        case AuditAction.ENABLE_CUSTOMER: return "Enable Customer";

        case AuditAction.CREATE_AGENT: return "Create Agent";
        case AuditAction.UPDATE_AGENT: return "Update Agent";
        case AuditAction.DISABLE_AGENT: return "Disable Agent";
        case AuditAction.DELETE_AGENT: return "Delete Agent";
        case AuditAction.ENABLE_AGENT: return "Enable Agent";
        
        case AuditAction.LOGIN: return "Login";

        case AuditAction.UPDATE_CONFIG: return "Update Config";
        case AuditAction.UPDATE_SOFTWARE_SETTINGS: return "Update Software Settings";

        case AuditAction.EXPORT_TABLE: return "Export Table";

        case AuditAction.CREATE_REPORT: return "Create Report";
        case AuditAction.UPDATE_REPORT: return "Update Report";
        case AuditAction.EXECUTE_REPORT: return "Execute Report";
        case AuditAction.DELETE_REPORT: return "Delete Report";
    }
    return action;
}