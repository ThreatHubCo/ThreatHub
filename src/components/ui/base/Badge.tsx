import { Box, BoxProps, Text } from "@chakra-ui/react";

interface Props {
    label: string;
    bgColor: string;
    color: string;
}

export function Badge({ label, bgColor, color, ...props }: Props & BoxProps) {
    return (
        <Box
            bgColor={bgColor}
            color={color}
            paddingX={2}
            height={4.5}
            borderRadius={8}
            fontSize={10}
            {...props}
        >
            <Text>{label}</Text>
        </Box>
    )
}