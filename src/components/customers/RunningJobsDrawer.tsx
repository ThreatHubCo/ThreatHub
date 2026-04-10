import { Customer } from "@/lib/entities/Customer";
import { ScanJob } from "@/lib/entities/ScanJob";
import {
    Box,
    Button,
    CloseButton,
    Drawer,
    Flex,
    Portal,
    Stack,
    StackSeparator,
    Text
} from "@chakra-ui/react";

interface Props {
    open: boolean;
    onCancel: () => void;
    customer: Customer;
    jobs: ScanJob[];
}

export function RunningJobsDrawer({
    open,
    onCancel,
    customer,
    jobs
}: Props) {
    return (
        <Drawer.Root
            size="md"
            open={open}
            onOpenChange={({ open }) => onCancel()}
        >
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.Header>
                            <Drawer.Title>
                                Running Jobs for {customer.name}
                            </Drawer.Title>
                        </Drawer.Header>

                        <Drawer.Body>
                            {jobs.length === 0 ? (
                                <Text>No running jobs</Text>
                            ) : (
                                <Stack gap={2} separator={<StackSeparator />}>
                                    {jobs.map(job => (
                                        <Box
                                            key={job.id}
                                            border="1px solid"
                                            borderColor="gray.300"
                                            padding={4}
                                            borderRadius={10}
                                        >
                                            <Flex gap={4}>
                                                <Text>{job.type}</Text>
                                                <Text>{job.status}</Text>
                                                <Text>{job.requestedBy}</Text>
                                            </Flex>
                                            <Flex>
                                                <Text>{job.message}</Text>
                                                <Text>{job.progress}%</Text>
                                            </Flex>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Drawer.Body>

                        <Drawer.Footer>
                            <Drawer.ActionTrigger asChild>
                                <Button variant="outline">Close</Button>
                            </Drawer.ActionTrigger>
                        </Drawer.Footer>

                        <Drawer.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Drawer.CloseTrigger>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root >
    );
}
