import { Text } from "@chakra-ui/react";
import { Tooltip } from "./base/Tooltip";
import {
    formatDateReadable,
    formatDateTime,
    formatTimeAgo
} from "@/lib/utils/dates";

interface DateTextWithHoverProps {
    date: Date | string;
    reverse?: boolean;
    withTime?: boolean;
    showSeconds?: boolean;
}

export function DateTextWithHover({
    date,
    reverse,
    withTime,
    showSeconds
}: DateTextWithHoverProps) {
    if (!date) {
        return <Text>-</Text>;
    }

    function formatDate() {
        return withTime ? formatDateTime(date) : formatDateReadable(date);
    }

    const timeAgo = formatTimeAgo(date, { showSeconds });

    const tooltip = reverse ? formatDate() : timeAgo;
    const content = reverse ? timeAgo : formatDate();

    return (
        <Tooltip content={tooltip}>
            <Text lineHeight="1.3">{content}</Text>
        </Tooltip>
    );
}