export interface RemediationTicket {
    id: number;
    created_at: string;
    customer_id: number;
    software_id: number | null;
    external_ticket_id: string;
    status: RemediationTicketStatus;
    notes: string | null;
    opened_by_agent_id: number;
    opened_by_agent_name?: string;
    last_ticket_update_at: string;
    last_sync_at: string;
}

export enum RemediationTicketStatus {
    OPEN = "OPEN",
    CLOSED_GRACE_PERIOD = "CLOSED_GRACE_PERIOD",
    CLOSED = "CLOSED",
    UNKNOWN = "UNKNOWN"
}

export function formatTicketStatus(status: RemediationTicketStatus) {
    switch (status) {
        case RemediationTicketStatus.OPEN: return "Open";
        case RemediationTicketStatus.CLOSED_GRACE_PERIOD: return "Grace Period";
        case RemediationTicketStatus.CLOSED: return "Closed";
    }
    return "Unknown";
}