import { Text } from "@chakra-ui/react";
import { Tooltip } from "./base/Tooltip";
import { formatAsPercent } from "../../lib/utils/utils";

interface Props {
    epss: string | number;
}

export function EPSSDisplay({ epss }: Props) {
    if (!epss) {
        return <Text>-</Text>;
    }
    return (
        <Tooltip content={Number(epss)}>
            <Text lineHeight="1.3">{formatAsPercent(epss, 1)}</Text>
        </Tooltip>
    );
}