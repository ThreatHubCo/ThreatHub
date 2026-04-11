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
            border="1px solid"
            borderColor="gray.200"
            padding={{ base: 3, md: 4 }}
            borderRadius={8}
            {...props}
        >
            <Flex alignItems="center" gap={{ base: 2.5, md: 4 }}>
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
                    <Text fontSize={{ base: "14px", md: "16px" }} fontWeight="bold">{label}</Text>
                    <Text fontSize={{ base: "16px", md: "20px" }}>{value ?? "-"}</Text>
                </Box>
            </Flex>
        </Box>
    )
}