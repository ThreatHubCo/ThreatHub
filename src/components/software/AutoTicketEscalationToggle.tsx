import { Button, Flex, Stack, Text } from "@chakra-ui/react";
import { Switch } from "../ui/base/Switch";

export function AutoTicketEscalationToggle({
    setting,
    onChange,
    onReset,
    isCustomerView,
    isLoading
}) {
    return (
        <Stack gap={1}>
            <Flex align="center" justify="space-between">
                <Text fontSize="sm" fontWeight="medium">
                    Automatic ticket escalation
                </Text>

                <Switch
                    checked={setting.effective}
                    disabled={isLoading}
                    onCheckedChange={(e) => onChange(e.checked)}
                />
            </Flex>

            {isCustomerView && (
                <Text fontSize="xs" color="gray.500">
                    {setting.source === "CUSTOMER"
                        ? "Using customer override"
                        : `Using global default (${setting.global ? "ON" : "OFF"})`}
                </Text>
            )}

            {isCustomerView && setting.source === "CUSTOMER" && (
                <Button
                    size="xs"
                    variant="ghost"
                    onClick={onReset}
                >
                    Reset to global default
                </Button>
            )}
        </Stack>
    )
}