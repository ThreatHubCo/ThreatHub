import { Box, BoxProps } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export function WhiteBox({ children, ...props }: PropsWithChildren<BoxProps>) {
    return (
        <Box
            bgColor="white"
            paddingY={4}
            paddingX={6}
            borderRadius={8}
            border="1px solid"
            borderColor="gray.200"
            {...props}
        >
            {children}
        </Box>
    )
}