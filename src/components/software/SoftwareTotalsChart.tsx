import { Box, Button, Flex, HStack, NativeSelect, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

export default function SoftwareTotalsChart({ software, customer }) {
    const [data, setData] = useState([]);
    const [range, setRange] = useState("week");
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        load();
    }, [range, offset, customer]);

    async function load() {
        try {
            let url = `/api/software/${software.id}/timeline?range=${range}&offset=${offset}`;

            if (customer) {
                url += `&customer=${customer.id}`;
            }

            const res = await fetch(url);
            const json = await res.json();
            setData(json.data);
        } catch (e) {
            console.error("Failed to load software timeline", e);
        }
    }

    return (

        <Box>
            <Flex marginBottom={4} justifyContent="space-between">
                <HStack>
                    <Button
                        height={7}
                        onClick={() => setOffset(o => o + 1)}
                    >
                        <LuChevronLeft />
                    </Button>

                    <Button
                        height={7}
                        onClick={() => setOffset(o => Math.max(o - 1, 0))}
                        disabled={offset === 0}
                    >
                        <LuChevronRight />
                    </Button>
                </HStack>

                <HStack gap={3}>
                    <Text whiteSpace="nowrap" fontSize="14px">Date Range</Text>

                    <NativeSelect.Root width="120px">
                        <NativeSelect.Field
                            value={range}
                            onChange={(e) => {
                                setRange(e.target.value);
                                setOffset(0);
                            }}
                            height={7}
                        >
                            <option value="week">Week</option>
                            <option value="month">Month</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                </HStack>
            </Flex>

            <Box height="300px">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <XAxis
                            dataKey="day"
                            tickFormatter={(value) =>
                                new Date(value).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric"
                                })
                            }
                        />
                        <YAxis />
                        <Tooltip
                            labelFormatter={(value) =>
                                new Date(value).toLocaleDateString(undefined, {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                })
                            }
                        />
                        <Line
                            type="monotone"
                            dataKey="total_vulnerable_devices"
                            name="Total Vulnerable Devices"
                            stroke="#E53E3E"
                            strokeWidth={3}
                        />
                        <Line
                            type="monotone"
                            dataKey="resolved_devices_today"
                            name="Devices Resolved Today"
                            stroke="#38A169"
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Box>

        </Box>

    );
}