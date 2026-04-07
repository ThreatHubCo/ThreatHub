import { Severity } from "./Vulnerability";

export interface Software {
    id: number;
    name: string;
    vendor: string | null;
    formatted_name: string | null;
    formatted_vendor: string | null;
    summary: string | null;
    notes: string | null;
    auto_ticket_escalation_enabled: boolean;
    public_exploit?: boolean;
    vulnerable_versions?: string;
    exploit_verified?: boolean;
    highest_cve_severity?: Severity;
    highest_cve_epss?: number;
    highest_cve_cvss_v3?: number;
}

export interface SoftwareSummary {
    id: number;
    name: string;
    vendor: string;
    auto_ticket_escalation_enabled: boolean;
    clients_affected: number;
    devices_affected: number;
    highest_cve_severity?: Severity;
    highest_cve_epss?: number;
    highest_cve_cvss_v3?: number;
    vulnerable_versions?: string;
}

export interface SoftwareInfoStats {
    totalCves: number;
    totalCustomers: number;
    totalDevices: number;
    totalTickets: number;
    totalHighCves: number;
    totalCriticalCves: number;
    totalPublicExploit: boolean;
    highestCveSeverity: Severity;
    highestCveEpss: string;
}