import { formatScanStatus, ScanStatus } from "@/lib/entities/ScanJob";
import { Box, BoxProps } from "@chakra-ui/react";

interface Props {
    value: ScanStatus;
}

export function ScanJobStatusCell({ value, ...props }: Props & BoxProps) {
    const statusColors = getStatusColor(value);

    return (
        <Box
            bgColor={statusColors.bg}
            color={statusColors.color}
            border="1px solid"
            borderColor={statusColors.border}
            borderRadius="sm"
            paddingX={2}
            fontSize="12px"
            fontWeight="600"
            width="fit-content"
        >
            {formatScanStatus(value)}
        </Box>
    )
}

function getStatusColor(status: ScanStatus) {
    switch (status) {
        case ScanStatus.PENDING: return { bg: "gray.200", border: "gray.500", color: "gray.700" }
        case ScanStatus.RUNNING: return { bg: "blue.100", border: "blue.400", color: "blue.700" }
        case ScanStatus.COMPLETE: return { bg: "green.100", border: "green.400", color: "green.700" }
        case ScanStatus.FAILED: return { bg: "red.100", border: "red.400", color: "red.700" }
    }
    return { bg: "gray.200", color: "gray.700" }
}