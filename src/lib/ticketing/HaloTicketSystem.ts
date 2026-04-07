import { Customer } from "@/lib/entities/Customer";
import { ITicketSystem } from "@/lib/ticketing/ITicketSystem";
import { ConfigKey } from "../entities/Config";

export class HaloTicketSystem implements ITicketSystem {
    private cachedToken: string | null = null;
    private tokenExpiresAt = 0;

    constructor(private config: Record<ConfigKey, any>) {}

    private async getAuthToken(): Promise<string> {
        if (this.cachedToken && Date.now() < this.tokenExpiresAt) {
            return this.cachedToken;
        }

        const res = await fetch(`${this.config.TICKET_SYSTEM_URL}/auth/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                client_id: this.config.TICKET_SYSTEM_CLIENT_ID,
                client_secret: this.config.TICKET_SYSTEM_CLIENT_SECRET,
                scope: "all",
                grant_type: "client_credentials"
            })
        });

        if (!res.ok) {
            throw new Error("Failed to authenticate with Halo PSA");
        }

        const data = await res.json();

        this.cachedToken = data.access_token;
        this.tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60_000;

        return this.cachedToken;
    }

    async createTicket(customer: Customer, subject: string, body: string): Promise<string | null> {
        const token = await this.getAuthToken();

        const res = await fetch(`${this.config.TICKET_SYSTEM_URL}/api/IncomingEvent/Process`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                type: "VulnerabilityNotification",
                data: {
                    tenantId: customer.tenant_id,
                    clientId: customer.external_customer_id,
                    ticket: {
                        summary: subject,
                        details: body
                    }
                }
            })
        });

        if (!res.ok) {
            console.warn("Failed to create Halo ticket");
            return null;
        }

        const data = await res.json();
        return data.entity_id ?? null;
    }
}
