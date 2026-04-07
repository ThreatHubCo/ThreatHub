import { Progress as ChakraProgress, Box } from "@chakra-ui/react";
import { InfoTip } from "@/components/ui/base/ToggleTip";
import * as React from "react";

interface ProgressRange {
    value: number;
    color?: string;
}

interface ProgressProps extends ChakraProgress.RootProps {
    showValueText?: boolean
    valueText?: React.ReactNode
    label?: React.ReactNode
    info?: React.ReactNode
    ranges?: ProgressRange[] 
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
    function Progress(props, ref) {
        const { showValueText, valueText, label, info, ranges, ...rest } = props

        return (
            <ChakraProgress.Root {...rest} ref={ref}>
                {label && (
                    <ChakraProgress.Label>
                        {label} {info && <InfoTip>{info}</InfoTip>}
                    </ChakraProgress.Label>
                )}

                <ChakraProgress.Track position="relative" overflow="hidden">
                    {ranges ? (
                        ranges.map((range, index) => (
                            <Box
                                key={index}
                                position="absolute"
                                top={0}
                                left={0}
                                height="100%"
                                width={`${Math.min(range.value, 100)}%`}
                                bg={range.color}
                                transition="width 0.2s ease-in-out"
                                zIndex={ranges.length - index}
                            />
                        ))
                    ) : (
                        <ChakraProgress.Range bg={props.color} />
                    )}
                </ChakraProgress.Track>

                {showValueText && (
                    <ChakraProgress.ValueText>{valueText}</ChakraProgress.ValueText>
                )}
            </ChakraProgress.Root>
        )
    }
)