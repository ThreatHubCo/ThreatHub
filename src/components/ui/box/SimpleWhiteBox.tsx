import { Box, BoxProps, Heading, Text } from "@chakra-ui/react";
import { PropsWithChildren } from "react";
import { WhiteBox } from "./WhiteBox";

interface Props {
    title: string;
    subtitle?: string | React.ReactNode;
}

export function SimpleWhiteBox({ title, subtitle, children, ...props }: PropsWithChildren<Props & BoxProps>) {
    return (
        <WhiteBox {...props}>
            <Heading size="xl" marginBottom={subtitle ? 0.5 : 3}>
                {title}
            </Heading>

            {subtitle && (
                <Text
                    fontSize="13px"
                    marginBottom={4}
                    color="gray.500"
                >
                    {subtitle}
                </Text>
            )}

            <Box>{children}</Box>
        </WhiteBox>
    )
}