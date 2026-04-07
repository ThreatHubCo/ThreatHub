import { toaster } from "@/components/ui/base/Toaster";
import { useConfig } from "@/lib/config/ConfigContext";
import { Session } from "@/lib/entities/Session";
import { AbsoluteCenter, Box, Button, Field, Heading, Input, Stack, Text } from "@chakra-ui/react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaMicrosoft } from "react-icons/fa";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const router = useRouter();
    const config = useConfig();
    const { data: session, status: sessionStatus } = useSession() as Session;

    useEffect(() => {
        fetchSetupInfo();
        
        if (router?.query?.error) {
            toaster.create({ type: "error", title: "Failed to login", description: router.query.error });
            window.history.replaceState(null, "", "login");
        }
    }, []);

     async function fetchSetupInfo() {
        try {
            const response = await fetch("/api/setup");
            const json = await response.json();

            if (!json.mysqlOnline || !json.hasAgents) {
                router.push("/setup");
            }
        } catch (e) {
            console.error(e);
        }
    }

    if (sessionStatus === "authenticated") {
        router.push("/");
        return false;
    }

    return (
        <>
            <AbsoluteCenter width="100%">
                <Box
                    bgColor="white"
                    padding={4}
                    borderRadius={8}
                    width={{ base: "100%", md: "400px" }}
                >
                    <Heading size="4xl" marginBottom={6} textAlign="center">Log in</Heading>

                    <Stack gap={4} marginBottom={4}>
                        {config.ENABLE_PASSWORD_AUTH && (
                            <>
                                <Field.Root>
                                    <Field.Label>Email address</Field.Label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Password</Field.Label>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </Field.Root>

                                <Button
                                    onClick={() => signIn("credentials", { email, password, callbackUrl: window.location.origin })}
                                >
                                    Log in
                                </Button>

                                <Text textAlign="center">or</Text>
                            </>
                        )}

                        {config.ENABLE_MICROSOFT_AUTH && (
                            <Button
                                bgColor="white"
                                color="black"
                                border="1px solid"
                                borderColor="gray.400"
                                _hover={{
                                    bgColor: "blue.100",
                                    transform: "scale(1.05)"
                                }}
                                onClick={() => signIn("azure-ad")}
                            >
                                <FaMicrosoft /> Sign in with Microsoft
                            </Button>
                        )}
                    </Stack>
                </Box>
            </AbsoluteCenter>
        </>
    )
}

Login.noSidebar = true;