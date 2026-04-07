import { Box, Heading } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

interface Props {
    title: string;
}

export function AdminSection({ title, children }: PropsWithChildren<Props>) {
    return (
        <Box
            bgColor="white"
            padding={4}
            borderRadius={10}
            border="1px solid"
            borderColor="gray.300"
        >
            <Heading size="xl" marginBottom={4}>{title}</Heading>
            {children}
        </Box>
    )
}