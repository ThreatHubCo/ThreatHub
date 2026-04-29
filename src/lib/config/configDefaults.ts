import { ConfigKey, TicketSystemType } from "@/lib/entities/Config";

// NOTE: This should match EXACTLY to the ConfigKey class in the ThreatHub Ingestor program
export const DEFAULT_CONFIG: Record<ConfigKey, { value: any; type: "string" | "number" | "boolean" | "json" }> = {
    [ConfigKey.ENABLE_PASSWORD_AUTH]: { value: true, type: "boolean" },
    [ConfigKey.ENABLE_MICROSOFT_AUTH]: { value: true, type: "boolean" },
    [ConfigKey.ENABLE_TICKETING]: { value: false, type: "boolean" },
    
    [ConfigKey.TICKET_SYSTEM_TYPE]: { value: null, type: "string" },
    [ConfigKey.TICKET_SYSTEM_URL]: { value: "", type: "string" },
    [ConfigKey.TICKET_SYSTEM_CLIENT_ID]: { value: "", type: "string" },
    [ConfigKey.TICKET_SYSTEM_CLIENT_SECRET]: { value: "", type: "string" },
    [ConfigKey.MIN_CVE_SEVERITY_FOR_ESCALATION]: { value: "High", type: "string" },
    // [ConfigKey.WAIT_TIME_BEFORE_ESCALATION]: { value: 7, type: "number" },
    [ConfigKey.ESCALATE_PUBLIC_EXPLOIT_IMMEDIATELY]: { value: true, type: "boolean" },

    [ConfigKey.HOME_TENANT_ID]: { value: "", type: "string" },
    [ConfigKey.SITE_URL]: { value: "", type: "string" },

    [ConfigKey.ENTRA_AUTH_CLIENT_ID]: { value: "", type: "string" },
    [ConfigKey.ENTRA_AUTH_CLIENT_SECRET]: { value: "", type: "string" },
    [ConfigKey.ENTRA_BACKEND_CLIENT_ID]: { value: "", type: "string" },
    [ConfigKey.ENTRA_BACKEND_CLIENT_SECRET]: { value: "", type: "string" },
    
    [ConfigKey.DEV_LOGGING_ENABLED]: { value: false, type: "boolean" },
    [ConfigKey.DEV_LOGGING_URL]: { value: "", type: "string" },

    [ConfigKey.INSTANCE_ID]: { value: "", type: "string" },
    [ConfigKey.EXTERNAL_LOG_FORWARDING]: { value: false, type: "boolean" },
    [ConfigKey.SEND_EXTERNAL_HEARTBEAT]: { value: false, type: "boolean" },

    [ConfigKey.SKIP_NON_ENTRA_JOINED_DEVICES]: { value: true, type: "boolean" },
    [ConfigKey.DELETE_DEVICES_OLDER_THAN]: { value: 30, type: "number" }
};