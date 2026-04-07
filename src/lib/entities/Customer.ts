export interface Customer {
    id: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    name: string;
    tenant_id: string | null;
    external_customer_id: string | null;
    supports_csp: boolean;
}

export interface CustomerStatus {
    totalCves: number;
    totalCvesWithPublicExploit: number;
    totalCriticalCves: number;

    totalDevices: number;
    totalVulnerableDevices: number;
    totalStaleDevices: number;

    openRemediationTickets: number;

    auditLogsLast7Days: number;
    auditLogsLast24Hours: number;

    totalVulnerableSoftware: number;

    vulnerabilitiesCreatedLast7Days: number;
    vulnerabilitiesCreatedLast24Hours: number;

    longRunningVulnerabilities: number;
}