import { formatTicketStatus, RemediationTicketStatus } from "@/lib/entities/RemediationTicket";
import { Box } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

interface Props {
    status: RemediationTicketStatus;
}

export const styles: Record<RemediationTicketStatus, { bg: string; border: string; color: string }> = {
    OPEN: { bg: "green.200", border: "green.300", color: "green" },
    CLOSED: { bg: "red.200", border: "red.300", color: "red.700" },
    CLOSED_GRACE_PERIOD: { bg: "orange.100", border: "orange.300", color: "orange.700" },
    UNKNOWN: { bg: "gray.200", border: "gray.300", color: "gray.700" }
}

export function TicketStatusCell({ status, children }: PropsWithChildren<Props>) {
    const { bg, border, color } = styles[status as RemediationTicketStatus];

    return (
        <Box
            bgColor={bg}
            color={color}
            paddingX={4}
            borderRadius="sm"
            fontWeight={600}
            fontSize="13px"
            textAlign="center"
            width="fit-content"
            border="1px solid"
            borderColor={border}
        >
            {children || formatTicketStatus(status)}
        </Box>
    )
}