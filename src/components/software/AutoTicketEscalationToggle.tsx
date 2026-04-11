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

            <Text fontSize="12px" color="gray.500">
                Automatically create tickets for this software when specific criteria is met. This criteria can be configured by an Admin.
            </Text>
        </Stack>
    )
}