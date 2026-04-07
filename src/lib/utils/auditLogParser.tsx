import { ReactNode } from "react";
import { AuditAction, AuditLog } from "../entities/AuditLog";
import { Heading, List } from "@chakra-ui/react";

interface ParsedAuditResponse {
    text: ReactNode;
    popover?: ReactNode
}

export function parseAuditLog(log: AuditLog): ParsedAuditResponse {
    const details = log.details as any;

    switch (log.action) {
        case AuditAction.CREATE_CUSTOMER: {
            return {
                text: <p>Customer: {details.name}</p>
            }
        }
        case AuditAction.ENABLE_CUSTOMER: {
            return {
                text: <p>Customer: {details.name}</p>
            }
        }
        case AuditAction.DISABLE_CUSTOMER: {
            return {
                text: <p>Customer: {details.name}<br/> Reason: {details.reason}</p>
            }
        }
        case AuditAction.CREATE_TICKET: {
            return {
                text: <p>Ticket ID: {details.external_ticket_id}<br/> Subject: {details.subject}</p>
            }
        }
        case AuditAction.UPDATE_CONFIG: {
            const s = details.keys.length === 1 ? "" : "s";
            return {
                text: <p>Updated {details.keys.length} option{s}: {details.keys.join(", ")}</p>
            }
        }
        case AuditAction.CREATE_AGENT: {
            return {
                text: <p>Email: {details.email}<br/> Display name: {details.display_name}<br/> Role: {details.role}</p>
            }
        }
        case AuditAction.ENABLE_AGENT: {
            return {
                text: <p>Email: {details.name}<br/> Display name: {details.display_name}</p>
            }
        }
        case AuditAction.DISABLE_AGENT: {
            return {
                text: <p>Email: {details.name}<br/> Display name: {details.display_name}<br/> Reason: {details.reason}</p>
            }
        }
         case AuditAction.LOGIN: {
            return {
                text: <p>Method: {details.method}</p>
            }
        }
        case AuditAction.UPDATE_SOFTWARE_SETTINGS: {
            return {
                text: <p>Updated {details?.updates?.length} settings for {details?.name} (by {details?.vendor}) (hover to view)</p>,
                 popover: (
                    <>
                        <Heading size="xs">Updates:</Heading>
                        <List.Root>
                            {details?.updates?.map(update => (
                                <List.Item key={update.key}>
                                    {update.key} - {String(update.old_value)} {">"} {String(update.new_value)}
                                </List.Item>
                            ))}
                        </List.Root>
                    </>
                )
            }
        }
        case AuditAction.CREATE_REPORT:
        case AuditAction.DELETE_REPORT:
        case AuditAction.EXECUTE_REPORT: {
            return {
                text: <p>Name: {details.name}<br/> Description: {details.description || "N/A"}<br/> Public?: {details.is_public ? "Yes" : "No"}</p>
            }
        }
    }
    return {
        text: <p>{JSON.stringify(log.details)}</p>
    }
}