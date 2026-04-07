import { Button, Center, Text } from "@chakra-ui/react";
import { Page } from "./Page";

interface Props {
    onRetry?: () => void;
    error: string
}

export function ErrorPage({ onRetry, error }: Props) {
    return (
        <Page title="Error">
            <Center height="100vh" flexDirection="column">
                <Text fontSize="2xl" color="red.500" mb={4}>Error: {error}</Text>
                {onRetry && <Button onClick={onRetry}>Retry</Button>}
            </Center>
        </Page>
    )
}