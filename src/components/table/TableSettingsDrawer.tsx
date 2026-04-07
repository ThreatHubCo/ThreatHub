import {
    Button,
    Checkbox,
    CloseButton,
    Drawer,
    Field,
    Heading,
    Portal,
    Separator,
    VStack
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Column } from "../ui/base/DataTable";
import { Switch } from "../ui/base/Switch";

interface SelectColumnsDrawerProps {
    open: boolean;
    onOpen: (open: boolean) => void;
    allColumns: Column<any>[];
    visibleColumnIds: string[];
    flipDates: boolean;
    onSave: (ids: string[], flipDates: boolean) => void;
}

export function TableSettingsDrawer({
    open,
    onOpen,
    allColumns,
    visibleColumnIds,
    flipDates,
    onSave
}: SelectColumnsDrawerProps) {
    const [draftIds, setDraftIds] = useState<string[]>(visibleColumnIds);
    const [draftFlipDates, setDraftFlipDates] = useState<boolean>(flipDates);

    useEffect(() => {
        setDraftFlipDates(flipDates);
        setDraftIds(visibleColumnIds);
    }, [open]);

    return (
        <Drawer.Root
            size="md"
            open={open}
            onOpenChange={({ open }) => onOpen(open)}
        >
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.Header>
                            <Drawer.Title>Edit Table Settings</Drawer.Title>
                        </Drawer.Header>

                        <Drawer.Body>
                            <Field.Root marginBottom={4}>
                                <Switch
                                    checked={draftFlipDates}
                                    onCheckedChange={(e) => setDraftFlipDates(e.checked)}
                                >
                                    Show Time Elapsed
                                </Switch>
                                <Field.HelperText>
                                    Display the time elapsed instead of the full date. Hover to see the exact date.
                                </Field.HelperText>
                            </Field.Root>

                            <Separator marginBottom={4} />

                            <Heading size="md" marginBottom={4}>Visible Columns</Heading>
                            <VStack align="stretch" gap={3}>
                                {allColumns.map(col => (
                                    <Checkbox.Root
                                        key={col.key as string}
                                        checked={draftIds.includes(col.key as string)}
                                        onCheckedChange={(e) => {
                                            setDraftIds((prev: any) =>
                                                e.checked
                                                    ? [...prev, col.key]
                                                    : prev.filter(id => id !== col.key)
                                            );
                                        }}
                                    >
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control />
                                        <Checkbox.Label>
                                            {col.label}
                                        </Checkbox.Label>
                                    </Checkbox.Root>
                                ))}
                            </VStack>
                        </Drawer.Body>

                        <Drawer.Footer>
                            <Drawer.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                            </Drawer.ActionTrigger>

                            <Button onClick={() => onSave(draftIds, draftFlipDates)}>
                                Save
                            </Button>
                        </Drawer.Footer>

                        <Drawer.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Drawer.CloseTrigger>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
}
