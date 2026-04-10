import "@/styles/globals.css";
import { Box, Button, ChakraProvider, createSystem, defaultConfig, defaultSystem, defineConfig, Flex } from "@chakra-ui/react";
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

const config = defineConfig({
    globalCss: {
        html: {
            colorPalette: "brand"
        }
    },
    theme: {
        tokens: {
            colors: {
                brand: {
                    50: { value: "#E6F9FC" },
                    100: { value: "#C2F0F7" },
                    200: { value: "#99E6F2" },
                    300: { value: "#66DBEC" },
                    400: { value: "#33CFE5" },
                    500: { value: "#0092b9" }, // your base color
                    600: { value: "#009BB8" },
                    700: { value: "#007D94" },
                    800: { value: "#005F70" },
                    900: { value: "#00424D" },
                    950: { value: "#002226" }
                }
            }
        },
        semanticTokens: {
            colors: {
                brand: {
                    solid: { value: "{colors.brand.500}" },
                    contrast: { value: "#ffffff" },
                    fg: { value: "{colors.brand.700}" },
                    muted: { value: "{colors.brand.100}" },
                    subtle: { value: "{colors.brand.100}" },
                    emphasized: { value: "{colors.brand.300}" },
                    focusRing: { value: "{colors.brand.500}" },
                    dark: {
                        solid: { value: { _light: "#1c293d", _dark: "#4a678a" } },
                        contrast: { value: "#fff" },
                        fg: { value: { _light: "#1c293d", _dark: "#e6f0ff" } },
                        muted: { value: { _light: "#e2e8f0", _dark: "#2a3b52" } },
                        subtle: { value: { _light: "#e8ecf1", _dark: "#3a506b" } },
                        emphasized: { value: { _light: "#94a3b8", _dark: "#4a678a" } },
                        focusRing: { value: { _light: "#1c293d", _dark: "#4a678a" } }
                    },
                    primaryColor: { value: "{colors.brand.500}" }
                }
            }
        }
    }
})

export const system = createSystem(defaultConfig, config)

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
            <ChakraProvider value={system}>
                <SkeletonPage />
            </ChakraProvider>
        )
    }

    return (
        <ChakraProvider value={system}>
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