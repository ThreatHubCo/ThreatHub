import { Page } from "@/components/ui/Page";
import { Center, Heading, Stack, Text } from "@chakra-ui/react";

export default function ServerError({ sidebarCollapsed }) {
    return (
        <Page
            title="Server Error"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Center height="80vh" flexDirection="column">
                <Stack gap={4} textAlign="center">
                    <Heading size="4xl">Internal Server Error</Heading>
                    <Text fontSize={18} maxWidth="500px">An unknown error has occurred. Please try again. Further information may be available in the browser console.</Text>
                </Stack>
            </Center>
        </Page>
    )
}