import { Text } from "@chakra-ui/react";
import { formatAsPercent } from "../../lib/utils/utils";
import { Tooltip, TooltipProps } from "./base/Tooltip";

interface Props {
    epss: string | number;
}

export function EPSSDisplay({ epss, content, ...props }: Props & Partial<TooltipProps>) {
    if (!epss) {
        return <Text>-</Text>;
    }
    return (
        <Tooltip content={Number(epss)} {...props}>
            <Text lineHeight="1.3">{formatAsPercent(epss, 1)}</Text>
        </Tooltip>
    );
}