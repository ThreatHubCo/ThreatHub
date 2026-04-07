import { Button, createListCollection, HStack, IconButton, Input, Popover, Portal, Select, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { LuCircleX } from "react-icons/lu";

type FilterPopoverProps = {
    label: string;
    value?: string;
    type?: "text" | "date" | "select" | "boolean" | "number";
    options?: { value: string; label: string }[];
    onApply: (value: string) => void;
    text?: string;
}

const booleanCollection = createListCollection({
    items: [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" }
    ]
});

const numberOperatorCollection = createListCollection({
    items: [
        { label: "Equals", value: "=" },
        { label: "Greater Than", value: ">" },
        { label: "Less Than", value: "<" }
    ]
});

export function FilterPopover({ label, value = "", type = "text", options, text, onApply }: FilterPopoverProps) {
    const [open, setOpen] = useState(false);
    const [localValue, setLocalValue] = useState(value);
    const [numberOp, setNumberOp] = useState("=");
    const [numberValue, setNumberValue] = useState("");

    const collection = useMemo(
        () => options ? createListCollection({ items: options }) : undefined,
        [options]
    );

    useEffect(() => {
        if (type === "number" && value) {
            setNumberOp(value[0]);
            setNumberValue(value.slice(1));
        }
    }, [type, value]);

    return (
        <Popover.Root open={open} onOpenChange={(d) => setOpen(d.open)}>
            <Popover.Trigger asChild>
                <Button size="sm" variant={value ? "solid" : "outline"}>
                    {label}: {value || "—"}
                </Button>
            </Popover.Trigger>
            <Portal>
                <Popover.Positioner>
                    <Popover.Content>
                        <Popover.Arrow />
                        <Popover.Body>
                            <Popover.Title fontWeight="medium" marginBottom={2}>{label}</Popover.Title>

                            {text && <Text fontSize="12px" marginBottom={3} lineHeight={1.3}>{text}</Text>}

                            <HStack gap={1}>
                                {type === "text" && (
                                    <Input value={localValue} onChange={(e) => setLocalValue(e.target.value)} />
                                )}

                                {type === "date" && (
                                    <Input type="date" value={localValue} onChange={(e) => setLocalValue(e.target.value)} />
                                )}

                                {type === "select" && options && (
                                    <Select.Root
                                        collection={collection}
                                        value={[localValue]}
                                        onValueChange={(v) => setLocalValue(v.value[0])}
                                        positioning={{ sameWidth: true, placement: "bottom" }}
                                    >
                                        <Select.HiddenSelect />

                                        <Select.Control>
                                            <Select.Trigger>
                                                <Select.ValueText placeholder="Select..." />
                                            </Select.Trigger>
                                            <Select.IndicatorGroup>
                                                <Select.Indicator />
                                            </Select.IndicatorGroup>
                                        </Select.Control>

                                        <Select.Positioner>
                                            <Select.Content>
                                                {collection.items.map((item) => (
                                                    <Select.Item key={item.value} item={item}>
                                                        {item.label}
                                                        <Select.ItemIndicator />
                                                    </Select.Item>
                                                ))}
                                            </Select.Content>
                                        </Select.Positioner>
                                    </Select.Root>
                                )}

                                {type === "boolean" && (
                                    <Select.Root
                                        collection={booleanCollection}
                                        value={localValue ? [localValue] : []}
                                        onValueChange={(v) => setLocalValue(v.value[0])}
                                        positioning={{ sameWidth: true, placement: "bottom" }}
                                    >
                                        <Select.HiddenSelect />

                                        <Select.Control>
                                            <Select.Trigger>
                                                <Select.ValueText placeholder="Select..." />
                                            </Select.Trigger>
                                            <Select.IndicatorGroup>
                                                <Select.Indicator />
                                            </Select.IndicatorGroup>
                                        </Select.Control>

                                        <Select.Positioner>
                                            <Select.Content>
                                                <Select.Item item={{ label: "Yes", value: "true" }}>
                                                    Yes
                                                    <Select.ItemIndicator />
                                                </Select.Item>
                                                <Select.Item item={{ label: "No", value: "false" }}>
                                                    No
                                                    <Select.ItemIndicator />
                                                </Select.Item>
                                            </Select.Content>
                                        </Select.Positioner>
                                    </Select.Root>
                                )}

                                {type === "number" && (
                                    <>
                                        <Select.Root
                                            collection={numberOperatorCollection}
                                            value={[numberOp]}
                                            onValueChange={(v) => setNumberOp(v.value[0])}
                                            positioning={{ sameWidth: true }}
                                        >
                                            <Select.HiddenSelect />
                                            <Select.Control>
                                                <Select.Trigger>
                                                    <Select.ValueText />
                                                </Select.Trigger>
                                                <Select.IndicatorGroup>
                                                    <Select.Indicator />
                                                </Select.IndicatorGroup>
                                            </Select.Control>

                                            <Select.Positioner>
                                                <Select.Content>
                                                    {numberOperatorCollection.items.map((item) => (
                                                        <Select.Item key={item.value} item={item}>
                                                            {item.label}
                                                            <Select.ItemIndicator />
                                                        </Select.Item>
                                                    ))}
                                                </Select.Content>
                                            </Select.Positioner>
                                        </Select.Root>

                                        <Input
                                            type="number"
                                            value={numberValue}
                                            onChange={(e) => setNumberValue(e.target.value)}
                                            placeholder="Value"
                                            width="150px"
                                        />
                                    </>
                                )}

                                <IconButton
                                    size="sm"
                                    variant="ghost"
                                    aria-label="Remove Filter"
                                    onClick={() => {
                                        onApply("");
                                        setLocalValue("");
                                        setNumberValue("");
                                        setNumberOp("=");
                                        setOpen(false);
                                    }}
                                >
                                    <LuCircleX />
                                </IconButton>
                            </HStack>
                            <HStack marginTop={2} justify="end">
                                <Button
                                    size="sm"
                                    colorScheme="blue"
                                    onClick={() => {
                                        if (type === "number") {
                                            onApply(numberValue ? `${numberOp}${numberValue}` : "");
                                        } else {
                                            onApply(localValue);
                                        }
                                        setOpen(false);
                                    }}
                                >
                                    Apply
                                </Button>
                            </HStack>
                        </Popover.Body>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
    );
}