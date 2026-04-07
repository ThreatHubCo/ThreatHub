import { AbsoluteCenter, Heading, Stack, Text } from "@chakra-ui/react";

export function NotAuthorisedPage() {
    return (
        <AbsoluteCenter>
            <Stack gap={4} textAlign="center">
                <Heading size="4xl">Not Authorised</Heading>
                <Text fontSize={18}>You are not authorised to access this page</Text>
                <Text>Please head back</Text>
            </Stack>
        </AbsoluteCenter>
    )
}