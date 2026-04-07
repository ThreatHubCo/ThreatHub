import { Severity } from "@/lib/entities/Vulnerability";
import { Box } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

interface SeverityCellProps {
    severity: Severity;
}

export const severityStyles: Record<Severity, { bg: string; color: string }> = {
    Critical: { bg: "red.200", color: "red.700" },
    High: { bg: "orange.200", color: "orange.700" },
    Medium: { bg: "yellow.100", color: "yellow.700" },
    Low: { bg: "green.200", color: "green.700" },
    Unknown: { bg: "gray.200", color: "gray.700" }
}

export function SeverityCell({ severity, children }: PropsWithChildren<SeverityCellProps>) {
    const { bg, color } = severityStyles[severity as Severity] || severityStyles.Unknown;

    return (
        <Box
            bgColor={bg}
            color={color}
            paddingX={4}
            borderRadius="sm"
            fontWeight={600}
            fontSize="13px"
        >
            {children || severity}
        </Box>
    )
}