import { Customer } from "@/lib/entities/Customer";
import { Software } from "@/lib/entities/Software";
import { findSoftwareInfo } from "@/lib/utils/softwareMap";
import { Button, Center, Flex, Link, Spinner, StackSeparator, Table, Text, VStack } from "@chakra-ui/react";
import { OpenInDefenderButton } from "./OpenInDefenderButton";
import { Tooltip } from "./base/Tooltip";
import { LuExternalLink } from "react-icons/lu";

interface Props {
    items: Software[];
    onClickViewInfo?: (software: Software) => void;
    customer?: Customer;
}

export function DrawerSoftwareList({ items, onClickViewInfo, customer }: Props) {
    if (!items || items.length === 0) {
        return (
            <Center>
                <Spinner />
            </Center>
        )
    }
    return (
        <>
            <VStack
                align="start"
                gap={1}
                marginTop={2}
                separator={<StackSeparator />}
            >
                <Table.Root size="sm">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeader width="180px">Name & Vendor</Table.ColumnHeader>
                            {/* <Table.ColumnHeader>Vulnerable Versions</Table.ColumnHeader> */}
                            <Table.ColumnHeader width="20px"></Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {items.map(software => (
                            <Table.Row key={software.id}>
                                <Table.Cell>
                                    <Text>{findSoftwareInfo(software).name}</Text>
                                    <Text fontSize="12px" color="gray.500">{findSoftwareInfo(software).vendor}</Text>
                                </Table.Cell>
                                {/* <Table.Cell>{software.vulnerable_versions}</Table.Cell> */}
                                <Table.Cell>
                                    <Flex gap={1} justifyContent="end">
                                        <Tooltip content="Open Software Info Page">
                                            <Link href={`/software/${software.id}${customer ? `?customer=${customer.id}` : ""}`}>
                                                <Button
                                                    size="sm"
                                                    variant="plain"
                                                >
                                                    <LuExternalLink />
                                                </Button>
                                            </Link>
                                        </Tooltip>

                                        {customer && (
                                            <OpenInDefenderButton
                                                url={`https://security.microsoft.com/vulnerability-management-inventories/applications/${software.vendor}-_-${software.name}`}
                                                customer={customer}
                                                iconOnly
                                            />
                                        )}
                                    </Flex>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            </VStack>
        </>
    )
}

