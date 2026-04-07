import { Severity } from "./Vulnerability";

export interface Device {
    id: number;
    device_id?: number;
    created_at: string;
    updated_at: string;
    customer_id: number;    
    machine_id: string;
    dns_name: string | null;
    os_platform: string | null;
    os_version: string;
    asset_criticality_level: string | null;
    is_aad_joined: boolean;
    aad_device_id: string;
    last_sync_at: string;
    last_seen_at: string;
    total_vulnerabilities?: number;
}

export interface DeviceVulnerability {
    id: number;
    device_id: number;
    vulnerability_id: number;
    detected_at: string;
    status: "OPEN" | "IN_PROGRESS" | "REMEDIATED" | "MITIGATED" | "IGNORED";
    remediated_at: string | null;
    notes: string | null;
}

export interface DeviceWithVulnerabilities extends Device {
    vulnerability_id: number;
    status: DeviceVulnerability["status"];
    detected_at: string;
}

export interface DeviceSummary {
    device_id: number;
    machine_id: string;
    dns_name: string | null;
    os_platform: string | null;
    os_version: string | null;
    customer_id: number;
    total_notes: number;
    total_vulnerabilities: number;
    total_affected_software: number;
}

export interface DeviceInfoStats {
    totalSoftware: number;
    totalCves: number;
    totalCriticalCves: number;
    totalHighCves: number;
    totalPublicExploit: number;
    highestCveSeverity: Severity;
    highCveEpss: number;
}

export interface FullDevice extends Device {
    customer_name: string;
    customer_supports_csp: boolean;
    customer_tenant_id: string;
}