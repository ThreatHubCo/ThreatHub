import { Box, BoxProps } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export function ContentBox({ children, ...props }: PropsWithChildren<BoxProps>) {
    return (
        <Box
            bgColor="white"
            paddingY={5}
            paddingX={7}
            height="100%"
            width="100%"
            borderRadius="md"
            overflowY="scroll"
            {...props}
        >
            {children}
        </Box>
    )
}