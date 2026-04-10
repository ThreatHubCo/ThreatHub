import {
    Alert,
    Button,
    CloseButton,
    Drawer,
    Field,
    Input,
    Portal,
    Text
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface Props {
    open: boolean;
    onCancel: () => void;
    onSuccess: (reason: string) => void;
    title: string;
    summary: string;
    warning?: string;
    minLength?: number;
}

export function ReasonModal({
    open,
    onCancel,
    onSuccess,
    title,
    summary,
    warning,
    minLength
}: Props) {
    const [reason, setReason] = useState("");

    useEffect(() => {
        if (!open) {
            setReason("");
        }
    }, [open]);

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
                                {title}
                                <Text fontSize={14} fontWeight="normal">{summary}</Text>
                            </Drawer.Title>
                        </Drawer.Header>

                        <Drawer.Body>
                            {warning && (
                                <Alert.Root
                                    status="error"
                                    title="Warning"
                                    marginBottom={6}
                                >
                                    <Alert.Indicator />
                                    <Alert.Title>{warning}</Alert.Title>
                                </Alert.Root>
                            )}

                            <Field.Root>
                                <Field.Label>Reason</Field.Label>
                                <Input
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                />
                                <Field.HelperText display="flex" justifyContent="space-between" width="100%">
                                    {minLength && <Text>Reason must be at least {minLength} characters</Text>}
                                    <Text>{reason.length} / 200</Text>
                                </Field.HelperText>
                            </Field.Root>
                        </Drawer.Body>

                        <Drawer.Footer>
                            <Drawer.ActionTrigger asChild>
                                <Button
                                    colorPalette="brand.dark"
                                    variant="outline"
                                    height={8}
                                >
                                    Cancel
                                </Button>
                            </Drawer.ActionTrigger>

                            <Button
                                onClick={() => onSuccess(reason)}
                                disabled={reason === "" || (minLength && reason.length < minLength)}
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
        </Drawer.Root >
    );
}
