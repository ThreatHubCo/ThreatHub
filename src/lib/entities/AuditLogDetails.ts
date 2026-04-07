/**
 * This file (temporary) contains all audit details schemas.
 */

import { AgentRole } from "./Agent";
import { AuditAction } from "./AuditLog";

export interface AuditLogDetailsV1 { }

export interface CreateCustomerAuditDetailsV1 extends AuditLogDetailsV1 {
    name: string;
    via_import: boolean;
}

export interface EnableCustomerAuditDetailsV1 extends AuditLogDetailsV1 {
    name: string;
}

export interface DisableCustomerAuditDetailsV1 extends AuditLogDetailsV1 {
    name: string;
    reason: string;
}

export interface CreateAgentAuditDetailsV1 extends AuditLogDetailsV1 {
    display_name: string;
    email: string;
    role: AgentRole;
}

export interface UpdateAgentAuditDetailsV1 extends AuditLogDetailsV1 {
    fields: Record<string, { before: any; after: any }>;
}

export interface EnableAgentAuditDetailsV1 extends AuditLogDetailsV1 {
    display_name: string;
    email: string;
}

export interface DisableAgentAuditDetailsV1 extends AuditLogDetailsV1 {
    display_name: string;
    email: string;
    reason: string;
}

export interface CreateTicketAuditDetailsV1 extends AuditLogDetailsV1 {
    external_ticket_id: string;
    subject: string;
    description: string;
}

export interface UpdateConfigAuditDetailsV1 extends AuditLogDetailsV1 {
    keys: string[];
}

export interface RestrictedActionAttemptAuditDetailsV1 extends AuditLogDetailsV1 {
    action: AuditAction;
}

export interface UpdateSoftwareSettingsAuditDetailsV1 extends AuditLogDetailsV1 {
    name: string;
    vendor: string;
    is_global: boolean;
    updates: {
        key: string;
        old_value: string | boolean | number;
        new_value: string | boolean | number;
    }[]
}

export interface AgentLoginAuditDetailsV1 extends AuditLogDetailsV1 {
    email: string;
    display_name: string;
    method: "microsoft" | "credentials";
}

export interface CreateReportAuditDetailsV1 extends AuditLogDetailsV1 {
    name: string;
    description: string;
    is_public: boolean;
}

export interface UpdateReportAuditDetailsV1 extends AuditLogDetailsV1 {
    before: {
        name: string;
        description: string;
        is_public: boolean;
    }
    after: {
        name: string;
        description: string;
        is_public: boolean;
    }
}

export interface ExecuteReportAuditDetailsV1 extends AuditLogDetailsV1 {
    name: string;
    description: string;
    is_public: boolean;
}
