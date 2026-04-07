import { Box, BoxProps } from "@chakra-ui/react";

interface BooleanCellProps {
    value: boolean;
    reverse?: boolean;
}

export function BooleanCell({ value, reverse = false, ...props }: BooleanCellProps & BoxProps) {
    const effectiveValue = reverse ? !value : value;

    const bgColor = effectiveValue ? "red.200" : "green.200";
    const color = effectiveValue ? "red.700" : "green.700";

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