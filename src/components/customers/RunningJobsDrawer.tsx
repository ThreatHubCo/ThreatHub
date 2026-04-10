import { Customer } from "@/lib/entities/Customer";
import { formatScanStatus, formatScanType, ScanJob, ScanStatus } from "@/lib/entities/ScanJob";
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
import { DateTextWithHover } from "../ui/DateTextWithHover";
import { ScanJobStatusCell } from "../cell/ScanJobStatusCell";

interface Props {
    open: boolean;
    onCancel: () => void;
    customer: Customer;
    jobs: ScanJob[];
}

export function RunningJobsDrawer({ open, onCancel, customer, jobs }: Props) {
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
                        {open ? <DrawerContent open={open} onCancel={onCancel} customer={customer} jobs={jobs} /> : null}
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
}

function DrawerContent({ open, onCancel, customer, jobs }: Props) {
    return (
        <>
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
                        {jobs.map(job => {
                            return (
                                <Box
                                    key={job.id}
                                    border="1px solid"
                                    borderColor="gray.300"
                                    padding={4}
                                    borderRadius={10}
                                >
                                    <Flex gap={2} fontWeight="bold" marginBottom={1}>
                                        <Text>{formatScanType(job.type)}</Text>
                                        <Text>&bull;</Text>
                                        <ScanJobStatusCell value={job.status} />
                                        <Text>{job.requestedBy}</Text>
                                    </Flex>
                                    <Flex gap={1}>
                                        <Text>{job.progress}%</Text>
                                        <Text>&bull;</Text>
                                        <Text>{job.message}</Text>
                                    </Flex>
                                    <Text fontSize="12px" color="gray.500" marginTop={1}>
                                        <DateTextWithHover date={new Date(Number(job.createdAt))} reverse />
                                    </Text>
                                </Box>
                            );
                        })}
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
        </>
    );
}
