import { Severity } from "@/lib/entities/Vulnerability";
import { Box } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

interface SeverityCellProps {
    severity: Severity;
}

export const severityStyles: Record<Severity, { bg: string; border: string; color: string }> = {
    Critical: { bg: "red.200", border: "red.300", color: "red.700" },
    High: { bg: "orange.200", border: "orange.300", color: "orange.700" },
    Medium: { bg: "yellow.100", border: "yellow.300", color: "yellow.700" },
    Low: { bg: "green.200", border: "green.300", color: "green.700" },
    Unknown: { bg: "gray.200", border: "gray.300", color: "gray.700" }
}

export function SeverityCell({ severity, children }: PropsWithChildren<SeverityCellProps>) {
    const { bg, border, color } = severityStyles[severity as Severity] || severityStyles.Unknown;

    return (
        <Box
            bgColor={bg}
            color={color}
            paddingX={4}
            borderRadius="sm"
            fontWeight={600}
            fontSize="13px"
            width="fit-content"
            border="1px solid"
            borderColor={border}
        >
            {children || severity}
        </Box>
    )
}