import { formatTicketStatus, RemediationTicketStatus } from "@/lib/entities/RemediationTicket";
import { Box } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

interface Props {
    status: RemediationTicketStatus;
}

export const styles: Record<RemediationTicketStatus, { bg: string; color: string }> = {
    OPEN: { bg: "green.200", color: "green" },
    CLOSED: { bg: "red.200", color: "red.700" },
    CLOSED_GRACE_PERIOD: { bg: "orange.100", color: "orange.700" },
    UNKNOWN: { bg: "gray.200", color: "gray.700" }
}

export function TicketStatusCell({ status, children }: PropsWithChildren<Props>) {
    const { bg, color } = styles[status as RemediationTicketStatus];

    return (
        <Box
            bgColor={bg}
            color={color}
            paddingX={4}
            borderRadius="sm"
            fontWeight={600}
            fontSize="13px"
            textAlign="center"
        >
            {children || formatTicketStatus(status)}
        </Box>
    )
}