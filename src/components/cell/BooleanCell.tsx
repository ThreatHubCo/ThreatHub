import { Box, BoxProps } from "@chakra-ui/react";

interface BooleanCellProps {
    value: boolean;
}

export function BooleanCell({ value, ...props }: BooleanCellProps & BoxProps) {
    const bgColor = value ? "green.200" : "gray.200";
    const color = value ? "green.700" : "gray.700";

    return (
        <Box
            bgColor={bgColor}
            color={color}
            width="fit-content"
            paddingX={2}
            borderRadius="sm"
            fontWeight="600"
            fontSize="13px"
            {...props}
        >
            {value ? "Yes" : "No"}
        </Box>
    )
}