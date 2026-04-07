import { Box, Flex, Text } from "@chakra-ui/react";

export function Stat({
    icon,
    label,
    value,
    bgColor,
    color,
    ...props
}) {
    return (
        <Box
            bgColor="white"
            padding={4}
            borderRadius={8}
            {...props}
        >
            <Flex alignItems="center" gap={4}>
                <Flex
                    height={10}
                    width={10}
                    bgColor={bgColor}
                    color={color}
                    justifyContent="center"
                    alignItems="center"
                    borderRadius="50%"
                    fontSize={20}
                >
                    {icon}
                </Flex>
                <Box>
                    <Text fontWeight="bold">{label}</Text>
                    <Text fontSize={20}>{value ?? "-"}</Text>
                </Box>
            </Flex>
        </Box>
    )
}