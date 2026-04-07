import "@/styles/globals.css";
import { Box, Button, ChakraProvider, defaultSystem, Flex } from "@chakra-ui/react";
import type { AppProps } from "next/app";
import { Toaster } from "@/components/ui/base/Toaster";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/ui/Sidebar";
import { useEffect, useState } from "react";
import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { ConfigProvider } from "@/lib/config/ConfigProvider";
import { LuMenu } from "react-icons/lu";

type MyAppProps = AppProps & {
    Component: AppProps["Component"] & { noSidebar?: boolean };
}

export default function App({ Component, pageProps }: MyAppProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("sidebarCollapsed");

            if (saved !== null) {
                setCollapsed(saved === "true");
            }
        } catch {
            // Do nothing
        }

        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem("sidebarCollapsed", String(collapsed));
        }
    }, [collapsed, mounted]);

    if (!mounted) {
        return (
            <ChakraProvider value={defaultSystem}>
                <SkeletonPage />
            </ChakraProvider>
        )
    }

    return (
        <ChakraProvider value={defaultSystem}>
            <ConfigProvider>
                <SessionProvider>
                    <Flex direction={{ base: "column", md: "row" }}>
                        <Box
                            display={{ base: "block", md: "none" }}
                            width="100%"
                            height={10}
                        >
                            <Button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                variant="ghost"
                                color="black"
                                aria-label="Toggle sidebar"
                            >
                                <LuMenu />
                            </Button>
                        </Box>
                        {!Component.noSidebar && (
                            <Sidebar
                                mobileOpen={mobileOpen}
                                setMobileOpen={setMobileOpen}
                                collapsed={collapsed}
                                setCollapsed={setCollapsed}
                            />
                        )}
                        <Component sidebarCollapsed={collapsed} {...pageProps} />
                    </Flex>
                </SessionProvider>
            </ConfigProvider>
            <Toaster />
        </ChakraProvider>
    )
}