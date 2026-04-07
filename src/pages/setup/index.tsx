import { toaster } from "@/components/ui/base/Toaster";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { AbsoluteCenter, Box, Button, Field, Heading, Input, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Setup() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const router = useRouter();

    useEffect(() => {
        fetchInfo();
    }, []);

    async function fetchInfo() {
        try {
            const response = await fetch("/api/setup");
            const json = await response.json();

            if (!json.mysqlOnline) {
                setError("Cannot connect to MySQL. Please set up your .env file correctly.");
            } else if (json.hasAgents) {
                setError("Setup has already been completed.");
            }
        } catch (e) {
            console.error(e);
            setError("Failed to fetch setup info");
        } finally {
            setLoading(false);
        }
    }

    async function createAgent() {
        if (!email || !password) {
            toaster.create({ title: "Please enter both email and password", type: "error" });
            return;
        }

        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const json = await response.json();

            if (json?.error) {
                toaster.create({ title: json?.error, type: "error" });
                return;
            }

            toaster.create({ title: "Admin account created successfully!" });
            router.push("/");
        } catch (e) {
            console.error(e);
            setError("Failed to create admin account");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <SkeletonPage />
    }

    return (
        <AbsoluteCenter width="100%">
            <Box
                bgColor="white"
                padding={4}
                borderRadius={8}
                width={{ base: "100%", md: "400px" }}
            >
                <Heading size="3xl" marginBottom={4} textAlign="center">
                    Welcome to ThreatHub!
                </Heading>

                <Text marginBottom={4} textAlign="center">
                    Please fill out the form below to finish the setup.
                </Text>

                {error ? (
                    <Box
                        bgColor="red.600"
                        marginBottom={4}
                        color="white"
                        paddingY={2}
                        paddingX={3}
                        borderRadius={5}
                    >
                        <Text fontWeight="bold" fontSize={18} marginBottom={1}>
                            Setup Error
                        </Text>
                        {error}
                    </Box>
                ) : (
                    <Stack gap={6} marginTop={6}>
                        <Field.Root>
                            <Field.Label>Admin Email Address</Field.Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </Field.Root>

                        <Field.Root>
                            <Field.Label>Admin Password</Field.Label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </Field.Root>

                        <Button
                            bgColor="white"
                            color="black"
                            border="1px solid"
                            borderColor="gray.400"
                            _hover={{
                                bgColor: "blue.50",
                                transform: "scale(1.05)"
                            }}
                            onClick={() => createAgent()}
                            loading={loading}
                        >
                            Submit
                        </Button>
                    </Stack>
                )}
            </Box>
        </AbsoluteCenter>
    );
}

Setup.noSidebar = true;