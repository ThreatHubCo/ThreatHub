import { Box } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface LogLevelCellProps {
    level: LogLevel;
}

export const logLevelStyles: Record<LogLevel, { bg: string; color: string }> = {
    INFO: { bg: "green.200", color: "green" },
    WARN: { bg: "orange.200", color: "orange.700" },
    ERROR: { bg: "red.100", color: "red.700" },
    DEBUG: { bg: "gray.200", color: "gray.700" }
}

export function LogLevelCell({ level, children }: PropsWithChildren<LogLevelCellProps>) {
    const { bg, color } = logLevelStyles[level as LogLevel];

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
            {children || level}
        </Box>
    )
}