import { Box } from "@chakra-ui/react";
import Head from "next/head";
import { PropsWithChildren } from "react";

interface Props {
    title: string;
    sidebarCollapsed?: boolean;
    hideSidebar?: boolean;
}

export function Page({
    title,
    children,
    sidebarCollapsed,
    hideSidebar
}: PropsWithChildren<Props>) {
    return (
        <>
            <Head>
                <title>{title}</title>
            </Head>

            <Box
                marginLeft={hideSidebar ? 0 : { base: 0, md: sidebarCollapsed ? "80px" : "220px" }}
                padding={6}
                flex="1"
                minHeight="100vh"
                bgColor="gray.100"
                color="black"
                transition="margin-left 0.2s ease"
            >
                {children}
            </Box>
        </>
    )
}