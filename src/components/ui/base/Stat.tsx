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
            paddingX={{ base: 3, md: 4 }}
            paddingY={3}
            borderLeft="4px solid"
            borderLeftColor={color}
            borderRadius={8}
            borderLeftRadius={6}
            flex="1 1 300px"
            {...props}
        >
            <Text fontSize={{ base: "14px", md: "16px" }}>{label}</Text>

            <Flex 
                alignItems="center" 
                justify="space-between"
                gap={{ base: 2.5, md: 4 }}
            >
                <Text fontSize={{ base: "20px", md: "28px" }} fontWeight="bold">
                    {value ?? "-"}
                </Text>

                <Flex
                    color={color}
                    justifyContent="center"
                    alignItems="center"
                    borderRadius="50%"
                    fontSize={28}
                >
                    {icon}
                </Flex>
            </Flex>
        </Box>
    )
}