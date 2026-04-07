import { Box, BoxProps, Flex, FlexProps, Spinner, Text } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

interface Props {
    loading: boolean;
    error?: string;
}

export function LoadingWrapper({ loading, error, children, ...props }: PropsWithChildren<Props & FlexProps & BoxProps>) {
    if (loading) {
        return (
            <Flex
                justifyContent="center"
                alignItems="center"
                flexDirection="column"
                {...props}
            >
                <Spinner marginBottom={4} />
                <Text>Loading</Text>
            </Flex>
        )
    }

    if (error) {
        return (
            <Box
                bgColor="red.200"
                color="red.700"
                borderRadius="md"
                paddingY={2}
                paddingX={4}
                {...props}
            >
                <Text fontWeight="bold">Failed to load</Text>
                <Text fontSize="14px">{error}</Text>
            </Box>
        )
    }

    return children;
}