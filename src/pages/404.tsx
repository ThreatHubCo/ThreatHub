import { Page } from "@/components/ui/Page";
import { Center, Heading, Stack, Text } from "@chakra-ui/react";

export default function NotFound({ sidebarCollapsed }) {
    return (
        <Page
            title="Not Found"
            sidebarCollapsed={sidebarCollapsed}
        >
            <Center height="80vh" flexDirection="column">
                <Stack gap={4} textAlign="center">
                    <Heading size="4xl">Page Not Found</Heading>
                    <Text fontSize={18}>The page you are looking for cannot be found.</Text>
                </Stack>
            </Center>
        </Page>
    )
}