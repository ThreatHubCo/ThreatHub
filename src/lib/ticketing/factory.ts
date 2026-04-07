import { TicketSystemType } from "../entities/Config";
import { HaloTicketSystem } from "./HaloTicketSystem";
import { ITicketSystem } from "./ITicketSystem";
import { getAllConfig } from "@/lib/repositories/config";

export async function getTicketSystem(): Promise<ITicketSystem> {
    const config = await getAllConfig();

    switch (config.TICKET_SYSTEM_TYPE) {
        case TicketSystemType.HALO_PSA:
            return new HaloTicketSystem(config);
        default:
            throw new Error("Unsupported ticket system type");
    }
}
