
import { Button, CloseButton, Drawer, Field, Input, Portal, Stack, Text, Textarea } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    category: any | null;
}

export function UpdateReportCategoryDrawer({ open, onClose, onSuccess, category }: Props) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !category) {
            return;
        }
        setName(category.name);
        setDescription(category.description ?? "");
        setError(null);
    }, [open, category]);

    async function handleSubmit() {
        if (!category) {
            return;
        }
        setError(null);

        try {
            setLoading(true);

            const res = await fetch(`/api/reports/categories/${category.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description: description || undefined
                })
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to update report category");
            }

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
                            <Drawer.Title>Edit Report Category</Drawer.Title>
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
                                disabled={!name.trim() || !category}
                                height={8}
                            >
                                Save Changes
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
