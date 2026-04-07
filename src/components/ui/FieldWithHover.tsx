import { Field } from "@chakra-ui/react";
import { PropsWithChildren } from "react";
import { LuInfo } from "react-icons/lu";
import { Tooltip } from "./base/Tooltip";

interface FieldWithHoverProps {
    label: string;
    summary: string;
}

export function FieldWithHover({ label, summary, children }: PropsWithChildren<FieldWithHoverProps>) {
    return (
        <Field.Root>
            <Field.Label>
                {label}
                <Field.RequiredIndicator
                    fallback={
                        <Tooltip content={summary}>
                            <LuInfo color="blue" />
                        </Tooltip>
                    }
                />
            </Field.Label>
            {children}
        </Field.Root>
    )
}