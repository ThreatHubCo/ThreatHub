import { AgentRole } from "@/lib/entities/Agent";
import { Session } from "@/lib/entities/Session";
import { Box, Button, Flex, Link, Separator, Text, VStack } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import NextLink from "next/link";
import { ReactNode, useState } from "react";
import { FiChevronDown, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { LuChartNoAxesColumnIncreasing, LuFolderCode, LuGroup, LuHouse, LuInfo, LuLogs, LuMonitor, LuSettings, LuTicket, LuTriangleAlert, LuUser, LuX } from "react-icons/lu";
import { Collapsible } from "../base/Collapsible";
import { Tooltip } from "../base/Tooltip";

interface SidebarLinkProps {
    icon?: ReactNode;
    label: string;
    href?: string;
    collapsed?: boolean;
    onClick?: () => void;
    children?: ReactNode;
}

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (value: boolean) => void;
    mobileOpen: boolean;
    setMobileOpen: (value: boolean) => void;
}

export function Sidebar({
    collapsed,
    setCollapsed,
    mobileOpen,
    setMobileOpen
}: SidebarProps) {
    const { data: session } = useSession() as Session;

    const [adminOpen, setAdminOpen] = useState(false);

    return (
        <Box
            as="nav"
            width={collapsed ? "80px" : "220px"}
            position={{ base: "absolute", md: "fixed" }}
            height="full"
            bgColor="gray.800"
            color="white"
            display={{ base: mobileOpen ? "block" : "none", md: "block" }}
            padding={5}
            transition="width 0.2s ease"
            zIndex={10}
        >
            {!collapsed && <Text fontSize="2xl" fontWeight="bold" marginBottom={6}>ThreatHub</Text>}

            <Button
                display={{ base: "block", md: "none" }}
                position="absolute"
                top={0}
                right={0}
                variant="ghost"
                color="white"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                <LuX />
            </Button>

            <VStack align="start" gap={1}>
                <SidebarLink label="Dashboard" href="/" collapsed={collapsed} icon={<LuHouse />} />
                <SidebarLink label="Agents" href="/agents" collapsed={collapsed} icon={<LuUser />} />
                <SidebarLink label="Customers" href="/customers" collapsed={collapsed} icon={<LuGroup />} />
                <SidebarLink label="Vulnerabilities" href="/vulnerabilities" collapsed={collapsed} icon={<LuTriangleAlert />} />
                {/* <SidebarLink label="Recommendations" href="/recommendations" collapsed={collapsed} icon={<LuClockAlert />} /> */}
                <SidebarLink label="Software" href="/software" collapsed={collapsed} icon={<LuFolderCode />} />
                <SidebarLink label="Devices" href="/devices" collapsed={collapsed} icon={<LuMonitor />} />
                <SidebarLink label="Tickets" href="/tickets" collapsed={collapsed} icon={<LuTicket />} />
                <SidebarLink label="Reports" href="/reports" collapsed={collapsed} icon={<LuChartNoAxesColumnIncreasing />} />
                <SidebarLink label="Backend Logs" href="/backend-logs" collapsed={collapsed} icon={<LuLogs />} />

                {session?.agent?.role === AgentRole.ADMIN && (
                    <>
                        <SidebarLink
                            label="Administration"
                            collapsed={collapsed}
                            icon={<LuSettings />}
                            onClick={() => setAdminOpen(!adminOpen)}
                        >
                            <Collapsible open={adminOpen && !collapsed} hideIndicator>
                                <VStack align="start" paddingLeft={6} gap={1}>
                                    <SidebarLink label="Information" href="/admin" collapsed={collapsed} icon={<LuInfo />} />
                                    <SidebarLink label="Audit Logs" href="/admin/audit-logs" collapsed={collapsed} icon={<LuLogs />} />
                                    <SidebarLink label="Config" href="/admin/config" collapsed={collapsed} icon={<LuSettings />} />
                                </VStack>
                            </Collapsible>
                        </SidebarLink>
                    </>
                )}
            </VStack>

            {!collapsed && <Separator marginY={5} borderColor="gray.600" />}
            {!collapsed && <Text fontSize="sm">&copy; {new Date().getFullYear()} ThreatHub</Text>}

            <Box position="absolute" bottom="4" left="0" width="100%">
                <SidebarLink
                    icon={collapsed ? <FiChevronRight /> : <FiChevronLeft />}
                    label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    collapsed={collapsed}
                    onClick={() => setCollapsed(!collapsed)}
                />
            </Box>
        </Box>
    )
}

export function SidebarLink({
    icon,
    label,
    href,
    onClick,
    collapsed = false,
    children
}: SidebarLinkProps) {
    const Wrapper = href ? Link : Box;

    return (
        <Tooltip
            content={label}
            disabled={!collapsed}
        >
            <Wrapper
                as={href ? NextLink : undefined}
                href={href}
                width="100%"
                textDecoration="none"
                _hover={{ textDecoration: "none" }}
                onClick={onClick}
            >
                <Flex
                    align="center"
                    gap={3}
                    px={3}
                    py={2}
                    borderRadius="md"
                    width="100%"
                    cursor="pointer"
                    _hover={{
                        bgColor: "gray.700"
                    }}
                    bgColor="gray.800"
                >
                    {icon && <Box fontSize="20px">{icon}</Box>}
                    {!collapsed && (
                        <Text fontSize="sm">{label}</Text>
                    )}

                    {children && !collapsed && (
                        <Box fontSize="16px">
                            {onClick && <FiChevronDown />}
                        </Box>
                    )}
                </Flex>
                {children}
            </Wrapper>
        </Tooltip>
    );
}