import { ServerSession } from "../entities/Session";

export enum AgentPermission {
    CUSTOMER_CREATE = "customers.create",
    CUSTOMER_IMPORT = "customers.import",
    CUSTOMER_EDIT = "customers.edit",
    CUSTOMER_ENABLE = "customers.enable",
    CUSTOMER_DISABLE = "customers.disable",
    CUSTOMER_VIEW_TAB = "customers.view_tab",
    CUSTOMER_VIEW_DETAILED_INFO = "customers.view_detailed_info",
    CUSTOMER_RUN_SYNC = "customers.run_sync",

    REPORT_CREATE = "reports.create",
    REPORT_EDIT = "reports.edit",
    REPORT_DELETE = "reports.delete",
    REPORT_VIEW_TAB = "reports.view_tab",
    REPORT_VIEW_HIDDEN = "reports.view_hidden_reports",

    REPORT_CATEGORY_CREATE = "reports.category.create",
    REPORT_CATEGORY_EDIT = "reports.category.edit",
    REPORT_CATEGORY_DELETE = "reports.category.delete",
    REPORT_CATEGORY_VIEW_TAB = "reports.category.view_tab",

    TICKET_VIEW_TAB = "tickets.view_tab",

    DEVICE_VIEW_TAB = "devices.view_tab",
    DEVICE_VIEW_DETAILED_INFO = "devices.view_detailed_info",

    SOFTWARE_VIEW_TAB = "software.view_tab",
    SOFTWARE_VIEW_DETAILED_INFO = "software.view_detailed_info",

    VULN_VIEW_TAB = "vulnerabilities.view_tab",

    AUDIT_LOG_VIEW = "admin.audit_logs.view",
    BACKEND_LOGS_VIEW = "admin.backend_logs.view",
    ADMIN_CONFIG_VIEW = "admin.config.view",
    ADMIN_CONFIG_MODIFY = "admin.config.modify",
    ADMIN_ROLES_VIEW = "admin.roles.view",
    ADMIN_ROLES_MODIFY = "admin.roles.modify",
    ADMIN_AGENTS_VIEW = "admin.agents.view",
    ADMIN_AGENTS_MODIFY = "admin.agents.modify",
    ADMIN_STATS_VIEW = "admin.stats.view"
}

export const AGENT_PERMISSION_GROUPS: Record<string, AgentPermission[]> = {
    Customers: [
        AgentPermission.CUSTOMER_CREATE,
        AgentPermission.CUSTOMER_IMPORT,
        AgentPermission.CUSTOMER_EDIT,
        AgentPermission.CUSTOMER_ENABLE,
        AgentPermission.CUSTOMER_DISABLE,
        AgentPermission.CUSTOMER_VIEW_TAB,
        AgentPermission.CUSTOMER_VIEW_DETAILED_INFO,
        AgentPermission.CUSTOMER_RUN_SYNC
    ],
    Reports: [
        AgentPermission.REPORT_CREATE,
        AgentPermission.REPORT_EDIT,
        AgentPermission.REPORT_DELETE,
        AgentPermission.REPORT_VIEW_TAB,
        AgentPermission.REPORT_VIEW_HIDDEN,
        AgentPermission.REPORT_CATEGORY_CREATE,
        AgentPermission.REPORT_CATEGORY_DELETE,
        AgentPermission.REPORT_CATEGORY_EDIT,
        AgentPermission.REPORT_CATEGORY_VIEW_TAB
    ],
    Tickets: [
        AgentPermission.TICKET_VIEW_TAB
    ],
    Devices: [
        AgentPermission.DEVICE_VIEW_TAB,
        AgentPermission.DEVICE_VIEW_DETAILED_INFO
    ],
    Software: [
        AgentPermission.SOFTWARE_VIEW_TAB,
        AgentPermission.SOFTWARE_VIEW_DETAILED_INFO
    ],
    Vulnerabilities: [
        AgentPermission.VULN_VIEW_TAB
    ],
    Administration: [
        AgentPermission.BACKEND_LOGS_VIEW,
        AgentPermission.AUDIT_LOG_VIEW,
        AgentPermission.ADMIN_CONFIG_VIEW,
        AgentPermission.ADMIN_CONFIG_MODIFY,
        AgentPermission.ADMIN_ROLES_VIEW,
        AgentPermission.ADMIN_ROLES_MODIFY,
        AgentPermission.ADMIN_AGENTS_VIEW,
        AgentPermission.ADMIN_AGENTS_MODIFY,
        AgentPermission.ADMIN_STATS_VIEW
    ]
}

const AgentPermissionDescriptions: Record<AgentPermission, string> = {
    [AgentPermission.CUSTOMER_CREATE]: "Allows creating new customers.",
    [AgentPermission.CUSTOMER_IMPORT]: "Allows importing customers in bulk.",
    [AgentPermission.CUSTOMER_EDIT]: "Allows editing customer information.",
    [AgentPermission.CUSTOMER_ENABLE]: "Allows enabling customers.",
    [AgentPermission.CUSTOMER_DISABLE]: "Allows disabling customers.",
    [AgentPermission.CUSTOMER_VIEW_TAB]: "Allows accessing the customers section.",
    [AgentPermission.CUSTOMER_VIEW_DETAILED_INFO]: "Allows viewing detailed customer information.",
    [AgentPermission.CUSTOMER_RUN_SYNC]: "Allows manually triggering customer synchronisation.",

    [AgentPermission.REPORT_CREATE]: "Allows creating new reports.",
    [AgentPermission.REPORT_EDIT]: "Allows editing existing reports.",
    [AgentPermission.REPORT_DELETE]: "Allows deleting reports.",
    [AgentPermission.REPORT_VIEW_TAB]: "Allows accessing the reports section.",
    [AgentPermission.REPORT_VIEW_HIDDEN]: "Allows viewing hidden reports",

    [AgentPermission.REPORT_CATEGORY_CREATE]: "Allows creating new report categories.",
    [AgentPermission.REPORT_CATEGORY_EDIT]: "Allows editing existing report categories.",
    [AgentPermission.REPORT_CATEGORY_DELETE]: "Allows deleting report categories.",
    [AgentPermission.REPORT_CATEGORY_VIEW_TAB]: "Allows accessing the report categories tab.",

    [AgentPermission.TICKET_VIEW_TAB]: "Allows accessing the tickets section.",

    [AgentPermission.DEVICE_VIEW_TAB]: "Allows accessing the devices section.",
    [AgentPermission.DEVICE_VIEW_DETAILED_INFO]: "Allows viewing detailed device information.",

    [AgentPermission.SOFTWARE_VIEW_TAB]: "Allows accessing the software section.",
    [AgentPermission.SOFTWARE_VIEW_DETAILED_INFO]: "Allows viewing detailed software information.",

    [AgentPermission.VULN_VIEW_TAB]: "Allows accessing the vulnerabilities section.",

    [AgentPermission.AUDIT_LOG_VIEW]: "Allows accessing administrative audit logs.",
    [AgentPermission.BACKEND_LOGS_VIEW]: "Allows accessing backend application logs.",
    [AgentPermission.ADMIN_CONFIG_VIEW]: "Allows viewing configuration settings.",
    [AgentPermission.ADMIN_CONFIG_MODIFY]: "Allows modifying configuration settings.",
    [AgentPermission.ADMIN_ROLES_VIEW]: "Allows viewing agent roles and their permissions.",
    [AgentPermission.ADMIN_ROLES_MODIFY]: "Allows creating, editing and managing agent roles and their permissions.",
    [AgentPermission.ADMIN_AGENTS_VIEW]: "Allows viewing agent accounts and their details.",
    [AgentPermission.ADMIN_AGENTS_MODIFY]: "Allows creating, editing, enabling, disabling and managing agent accounts.",
    [AgentPermission.ADMIN_STATS_VIEW]: "Allows viewing ThreatHub instance information"
}

export function getAgentPermissionDescription(permission: AgentPermission): string {
    return AgentPermissionDescriptions[permission] ?? "No description available.";
}

export function hasPermission(session: ServerSession, permission: AgentPermission): boolean {
    return session.agent.permissions.includes(permission);
}

export function hasAnyPermission(session: ServerSession, required: AgentPermission[]): boolean {
    return required.some(permission => session.agent.permissions.includes(permission));
}

export function hasAllPermissions(session: ServerSession, required: AgentPermission[]): boolean {
    return required.every(permission => session.agent.permissions.includes(permission));
}

export const adminSectionPermissions = [
    AgentPermission.ADMIN_CONFIG_VIEW,
    AgentPermission.ADMIN_AGENTS_VIEW,
    AgentPermission.ADMIN_ROLES_VIEW,
    AgentPermission.AUDIT_LOG_VIEW,
    AgentPermission.ADMIN_STATS_VIEW,
    AgentPermission.BACKEND_LOGS_VIEW
];

export const adminConfigPermissions = [
    AgentPermission.ADMIN_CONFIG_VIEW,
    AgentPermission.ADMIN_AGENTS_VIEW,
    AgentPermission.ADMIN_ROLES_VIEW
];