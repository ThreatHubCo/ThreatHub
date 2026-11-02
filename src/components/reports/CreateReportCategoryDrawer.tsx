
import { Button, CloseButton, Drawer, Field, Input, Portal, Stack, Text, Textarea } from "@chakra-ui/react";
import { useState } from "react";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateReportCategoryDrawer({open, onClose, onSuccess }: Props) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        setError(null);

        try {
            setLoading(true);

            const res = await fetch("/api/reports/categories/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description: description || undefined
                })
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to create report category");
            }

            setName("");
            setDescription("");
            onSuccess();
        } catch (e: any) {
            setError(e.message ?? "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Drawer.Root
            size="md"
            open={open}
            onOpenChange={() => onClose()}
        >
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.Header>
                            <Drawer.Title>Create Report Category</Drawer.Title>
                        </Drawer.Header>

                        <Drawer.Body>
                            <Stack align="stretch" gap={4}>
                                <Field.Root required>
                                    <Field.Label>
                                        Name <Field.RequiredIndicator />
                                    </Field.Label>
                                    <Input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        maxLength={100}
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Description</Field.Label>
                                    <Textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        rows={4}
                                    />
                                </Field.Root>

                                {error && (
                                    <Text color="red.500" fontSize="sm">
                                        {error}
                                    </Text>
                                )}
                            </Stack>
                        </Drawer.Body>

                        <Drawer.Footer>
                            <Drawer.ActionTrigger asChild>
                                <Button
                                    variant="outline"
                                    colorPalette="brand.dark"
                                    height={8}
                                    onClick={onClose}
                                >
                                    Cancel
                                </Button>
                            </Drawer.ActionTrigger>

                            <Button
                                onClick={handleSubmit}
                                loading={loading}
                                disabled={!name.trim()}
                                height={8}
                            >
                                Create Category
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
