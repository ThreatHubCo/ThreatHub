import { Collapsible as ChakraCollapsible } from "@chakra-ui/react";
import { PropsWithChildren, ReactNode } from "react";
import { LuChevronRight, LuInfo } from "react-icons/lu";
import { Tooltip } from "./Tooltip";

interface CollapsibleProps {
    label?: string | ReactNode;
    summary?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    hideIndicator?: boolean;
}

export function Collapsible({ label, summary, hideIndicator, open, onOpenChange, children, ...props }: PropsWithChildren<CollapsibleProps>) {
    return (
        <ChakraCollapsible.Root
            open={open}
            onOpenChange={(e) => onOpenChange?.(e.open)}
            {...props}
        >
            <ChakraCollapsible.Trigger
                display="flex"
                gap={2}
                alignItems="center"
                as="div"
            >
                {!hideIndicator && (
                    <ChakraCollapsible.Indicator
                        transition="transform 0.2s"
                        _open={{ transform: "rotate(90deg)" }}
                    >
                        <LuChevronRight />
                    </ChakraCollapsible.Indicator>
                )}
                {label}

                {summary && (
                    <Tooltip content={summary}>
                        <LuInfo color="blue" />
                    </Tooltip>
                )}
            </ChakraCollapsible.Trigger>

            <ChakraCollapsible.Content paddingTop={3}>
                {children}
            </ChakraCollapsible.Content>
        </ChakraCollapsible.Root>
    )
}