export enum AgentPermission {
    AGENT_CREATE = "agents.create",
    AGENT_ENABLE = "agents.enable",
    AGENT_DISABLE = "agents.disable",
    AGENT_DELETE = "agents.delete",
    AGENT_VIEW_TAB = "agents.view_tab",

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

    TICKET_VIEW_TAB = "tickets.view_tab",

    DEVICE_VIEW_TAB = "devices.view_tab",
    DEVICE_VIEW_DETAILED_INFO = "devices.view_detailed_info",

    SOFTWARE_VIEW_TAB = "software.view_tab",
    SOFTWARE_VIEW_DETAILED_INFO = "software.view_detailed_info",

    VULN_VIEW_TAB = "vulnerabilities.view_tab",

    AUDIT_LOG_VIEW_TAB = "admin.audit_logs.view_tab",
    BACKEND_LOGS_VIEW_TAB = "admin.backend_logs.view_tab",
    ADMIN_CONFIG_VIEW_TAB = "admin.config.view_tab"
}

export const AGENT_PERMISSION_GROUPS: Record<string, AgentPermission[]> = {
    Agents: [
        AgentPermission.AGENT_CREATE,
        AgentPermission.AGENT_ENABLE,
        AgentPermission.AGENT_DISABLE,
        AgentPermission.AGENT_DELETE,
        AgentPermission.AGENT_VIEW_TAB
    ],
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
        AgentPermission.REPORT_VIEW_TAB
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
        AgentPermission.AUDIT_LOG_VIEW_TAB,
        AgentPermission.BACKEND_LOGS_VIEW_TAB,
        AgentPermission.ADMIN_CONFIG_VIEW_TAB
    ]
}

const AgentPermissionDescriptions: Record<AgentPermission, string> = {
    [AgentPermission.AGENT_CREATE]: "Allows creating new agents.",
    [AgentPermission.AGENT_ENABLE]: "Allows enabling agents.",
    [AgentPermission.AGENT_DISABLE]: "Allows disabling agents.",
    [AgentPermission.AGENT_DELETE]: "Allows deleting agents.",
    [AgentPermission.AGENT_VIEW_TAB]: "Allows accessing the agents section.",

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

    [AgentPermission.TICKET_VIEW_TAB]: "Allows accessing the tickets section.",

    [AgentPermission.DEVICE_VIEW_TAB]: "Allows accessing the devices section.",
    [AgentPermission.DEVICE_VIEW_DETAILED_INFO]: "Allows viewing detailed device information.",

    [AgentPermission.SOFTWARE_VIEW_TAB]: "Allows accessing the software section.",
    [AgentPermission.SOFTWARE_VIEW_DETAILED_INFO]: "Allows viewing detailed software information.",

    [AgentPermission.VULN_VIEW_TAB]: "Allows accessing the vulnerabilities section.",

    [AgentPermission.AUDIT_LOG_VIEW_TAB]: "Allows accessing administrative audit logs.",
    [AgentPermission.BACKEND_LOGS_VIEW_TAB]: "Allows accessing backend application logs.",
    [AgentPermission.ADMIN_CONFIG_VIEW_TAB]: "Allows accessing administrative configuration settings."
}

export function getAgentPermissionDescription(permission: AgentPermission): string {
    return AgentPermissionDescriptions[permission] ?? "No description available.";
}