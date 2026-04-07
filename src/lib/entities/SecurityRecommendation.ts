export interface SecurityRecommendations {
    lastSyncAt: string;
    data: Recommendation[];
}

export interface Recommendation {
    id: number; 
    recommendationId?: string; // TODO Remove
    productName: string;
    recommendationName: string;
    vendor?: string;
    remediationType?: string;
    relatedComponent?: string;
    defenderRecommendationId: string;
    customerId: number;
    exposedMachinesCount: number;
    exposureImpact: number;
    configScoreImpact: number;
    totalMachinesCount: number;
    exposedCriticalDevices: number;
    publicExploit: boolean;
    activeAlert: boolean;
    hasUnpatchableCve: boolean;
    status: string;
    createdAt: string;
    eventsLast24h?: number;
    weaknesses: number;
}

export interface AggregatedRecommendation {
    id: number;
    defender_recommendation_id: string;
    product_name: string;
    recommendation_name: string;
    vendor: string | null;
    remediation_type: string | null;
    related_component: string | null;
    total_clients_affected: number;
    total_critical_devices: number;
    has_public_exploit: boolean;
    has_active_alert: boolean;
    events_last_24h: number;
}

export interface RecommendationEvent {
    id: number;
    created_at: string;
    cve_id?: string;
    customer_id: number;
    recommendation_id: number;
    field_name: string;
    old_value: string | null;
    new_value: string | null;
}