import { Customer } from "../entities/Customer";

export interface ITicketSystem {
    createTicket(customer: Customer, subject: string, description: string): Promise<string | null>;
}