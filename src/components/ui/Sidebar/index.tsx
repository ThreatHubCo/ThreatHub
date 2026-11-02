import { AgentRole } from "@/lib/entities/Agent";
import { Session } from "@/lib/entities/Session";
import { Box, Button, Flex, Image, Link, Separator, Text, VStack } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import NextLink from "next/link";
import { ReactNode, useState } from "react";
import { FiChevronDown, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { LuChartNoAxesColumnIncreasing, LuFolderCode, LuGroup, LuHouse, LuInfo, LuLogs, LuMonitor, LuSettings, LuTicket, LuTriangleAlert, LuUser, LuX } from "react-icons/lu";
import { Collapsible } from "../base/Collapsible";
import { Tooltip } from "../base/Tooltip";
import { adminConfigPermissions, adminSectionPermissions, AgentPermission, hasAnyPermission, hasPermission } from "@/lib/agents/permissions";

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
    const { data: session, status: sessionStatus } = useSession() as Session;

    const [adminOpen, setAdminOpen] = useState(false);

    return (
        <Box
            as="nav"
            width={collapsed ? "80px" : "220px"}
            position={{ base: "absolute", md: "fixed" }}
            height="full"
            bgColor="#17181c"
            color="white"
            display={{ base: mobileOpen ? "block" : "none", md: "block" }}
            padding={5}
            transition="width 0.2s ease"
            zIndex={10}
        >
            {/* {!collapsed && <Text fontSize="2xl" fontWeight="bold" marginBottom={6}>ThreatHub</Text>} */}
            <Image src={collapsed ? "/images/logo.png" : "/images/wordmark.png"} maxHeight="40px" marginBottom={6} />

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

            {sessionStatus === "authenticated" && (
                <VStack align="start" gap={0.5}>
                    <SidebarLink label="Dashboard" href="/" collapsed={collapsed} icon={<LuHouse />} />

                    {hasPermission(session, AgentPermission.CUSTOMER_VIEW_TAB) && (
                        <SidebarLink label="Customers" href="/customers" collapsed={collapsed} icon={<LuGroup />} />
                    )}
                    {hasPermission(session, AgentPermission.VULN_VIEW_TAB) && (
                        <SidebarLink label="Vulnerabilities" href="/vulnerabilities" collapsed={collapsed} icon={<LuTriangleAlert />} />
                    )}
                    {hasPermission(session, AgentPermission.SOFTWARE_VIEW_TAB) && (
                        <SidebarLink label="Software" href="/software" collapsed={collapsed} icon={<LuFolderCode />} />
                    )}
                    {hasPermission(session, AgentPermission.DEVICE_VIEW_TAB) && (
                        <SidebarLink label="Devices" href="/devices" collapsed={collapsed} icon={<LuMonitor />} />
                    )}
                    {hasPermission(session, AgentPermission.TICKET_VIEW_TAB) && (
                        <SidebarLink label="Tickets" href="/tickets" collapsed={collapsed} icon={<LuTicket />} />
                    )}
                    {hasPermission(session, AgentPermission.REPORT_VIEW_TAB) && (
                        <SidebarLink label="Reports" href="/reports" collapsed={collapsed} icon={<LuChartNoAxesColumnIncreasing />} />
                    )}

                    {/* <SidebarLink label="Recommendations" href="/recommendations" collapsed={collapsed} icon={<LuClockAlert />} /> */}

                    {hasAnyPermission(session, adminSectionPermissions) && (
                        <>
                            <SidebarLink
                                label="Administration"
                                collapsed={collapsed}
                                icon={<LuSettings />}
                                onClick={() => setAdminOpen(!adminOpen)}
                            >
                                <Collapsible open={adminOpen && !collapsed} hideIndicator>
                                    <VStack align="start" paddingLeft={6} gap={0.5}>
                                        {hasPermission(session, AgentPermission.ADMIN_STATS_VIEW) && (
                                            <SidebarLink label="Information" href="/admin" collapsed={collapsed} icon={<LuInfo />} />
                                        )}
                                        {hasPermission(session, AgentPermission.AUDIT_LOG_VIEW) && (
                                            <SidebarLink label="Audit Logs" href="/admin/audit-logs" collapsed={collapsed} icon={<LuLogs />} />
                                        )}
                                        {hasPermission(session, AgentPermission.BACKEND_LOGS_VIEW) && (
                                            <SidebarLink label="Backend Logs" href="/admin/backend-logs" collapsed={collapsed} icon={<LuLogs />} />
                                        )}
                                        {hasAnyPermission(session, adminConfigPermissions) && (
                                            <SidebarLink label="Config" href="/admin/config" collapsed={collapsed} icon={<LuSettings />} />
                                        )}
                                    </VStack>
                                </Collapsible>
                            </SidebarLink>
                        </>
                    )}
                </VStack>
            )}

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
                outlineOffset={0}
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
                    bgColor="#17181c"
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