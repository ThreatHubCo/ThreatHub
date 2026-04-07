import { Flex, Text } from "@chakra-ui/react";

interface Props {
    itemCount: number;
    totalCount?: number;
    ColumnSelectorButton: any;
    ExportButton: any;
}

export function TableToolbar({
    itemCount,
    totalCount,
    ColumnSelectorButton,
    ExportButton
}: Props) {
    return (
        <Flex
            alignItems="center"
            justifyContent="space-between"
            paddingY={2}
            wrap="wrap"
            gap={2}
        >
            <Flex alignItems="center" gap={4}>
                <ColumnSelectorButton />
                <Text marginRight="auto">
                    Showing {itemCount} of {totalCount} items
                </Text>
            </Flex>
            <ExportButton />
        </Flex>
    );
}
