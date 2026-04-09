export enum ScanType {
    GLOBAL_CATALOG_ALL = "GLOBAL_CATALOG_ALL",
    GLOBAL_SOFTWARE_CATALOG = "GLOBAL_SOFTWARE_CATALOG",
    GLOBAL_VULN_CATALOG = "GLOBAL_VULN_CATALOG",
    ALL_CUSTOMERS = "ALL_CUSTOMERS",
    SINGLE_CUSTOMER = "SINGLE_CUSTOMER",
    SINGLE_VULNERABILITY = "SINGLE_VULNERABILITY",
    SINGLE_RECOMMENDATION = "SINGLE_RECOMMENDATION",
    ALL_RECOMMENDATIONS = "ALL_RECOMMENDATIONS",
    ALL_VULNERABILITIES = "ALL_VULNERABILITIES",
    SINGLE_DEVICE = "SINGLE_DEVICE",
    DEVICE_CLEANUP = "DEVICE_CLEANUP",
    ALL_DEVICES = "ALL_DEVICES",
    SINGLE_TICKET = "SINGLE_TICKET",
    ALL_TICKETS_GLOBAL = "ALL_TICKETS_GLOBAL",
    ALL_TICKETS_CUSTOMER = "ALL_TICKETS_CUSTOMER"
}

export enum ScanTargetType {
    CUSTOMER = "CUSTOMER",
    VULNERABILITY = "VULNERABILITY",
    RECOMMENDATION = "RECOMMENDATION",
    TICKET = "TICKET",
    DEVICE = "DEVICE",
    SYSTEM = "SYSTEM"
}

export enum ScanStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETE = "COMPLETE",
    FAILED = "FAILED"
}

export interface ScanJob {
    id: string;
    type: ScanType;
    targetType: ScanTargetType;
    targetId?: string;
    requestedBy?: string;
    status: ScanStatus;
    progress: number;
    message: string;
    createdAt: string;
}

export function formatScanType(type: ScanType) {
    switch (type) {
        case ScanType.GLOBAL_CATALOG_ALL: return "Entire Global Catalog Sync";
        case ScanType.GLOBAL_SOFTWARE_CATALOG: return "Global Software Catalog Sync";
        case ScanType.GLOBAL_VULN_CATALOG: return "Global Vulnerability Catalog Sync";
        case ScanType.ALL_CUSTOMERS: return "All Customers Sync";
        case ScanType.SINGLE_CUSTOMER: return "Customer Sync";
        case ScanType.SINGLE_VULNERABILITY: return "Vulnerability Sync";
        case ScanType.SINGLE_RECOMMENDATION: return "Security Recommendation Sync";
        case ScanType.ALL_RECOMMENDATIONS: return "Security Recommendations Sync";
        case ScanType.ALL_VULNERABILITIES: return "Active Vulnerabilities Sync";
        case ScanType.SINGLE_DEVICE: return "Device Sync";
        case ScanType.DEVICE_CLEANUP: return "Device Cleanup";
        case ScanType.ALL_DEVICES: return "All Devices Sync";
        case ScanType.SINGLE_TICKET: return "Ticket Sync";
        case ScanType.ALL_TICKETS_GLOBAL: return "Global Ticket Sync";
        case ScanType.ALL_TICKETS_CUSTOMER: return "Customer Ticket Sync";
    }
    return type;
}

export function formatScanStatus(status: ScanStatus) {
    switch (status) {
        case ScanStatus.PENDING: return "Pending";
        case ScanStatus.RUNNING: return "Running";
        case ScanStatus.COMPLETE: return "Complete";
        case ScanStatus.FAILED: return "Failed";
    }
    return status;
}