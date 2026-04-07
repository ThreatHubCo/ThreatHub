import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import React from "react";

const cvssMetricNames: Record<string, string> = {
    // Base metrics
    AV: "Attack Vector",
    AC: "Attack Complexity",
    PR: "Privileges Required",
    UI: "User Interaction",
    S: "Scope",
    C: "Confidentiality Impact",
    I: "Integrity Impact",
    A: "Availability Impact",

    // Temporal metrics
    E: "Exploit Code Maturity",
    RL: "Remediation Level",
    RC: "Report Confidence"
}

const cvssMetrics: Record<string, Record<string, string>> = {
    AV: { N: "Remote network", A: "Adjacent network", L: "Local access", P: "Physical access" },
    AC: { L: "Easy to exploit", H: "Hard to exploit" },
    PR: { N: "No privileges needed", L: "Low privileges", H: "High privileges" },
    UI: { N: "No user needed", R: "User interaction required" },
    S: { U: "Scope unchanged", C: "Scope changed" },
    C: { H: "High confidentiality impact", L: "Low confidentiality impact", N: "No confidentiality impact" },
    I: { H: "High integrity impact", L: "Low integrity impact", N: "No integrity impact" },
    A: { H: "High availability impact", L: "Low availability impact", N: "No availability impact" }
}

const cvssTemporalMetrics: Record<string, Record<string, string>> = {
    E: { X: "Not defined", U: "Unproven", P: "PoC exists", F: "Functional exploit", H: "Widespread exploit" },
    RL: { X: "Not defined", O: "Official fix available", T: "Temporary fix available", W: "Workaround available", U: "No fix available" },
    RC: { X: "Not defined", U: "Unknown", R: "Reasonable", C: "Confirmed" }
}

interface ParsedCVSS { [key: string]: string; }

export function parseCVSSVector(vector: string): ParsedCVSS {
    const metrics = vector.replace(/^CVSS:3\.\d\//, "").split("/");
    const parsed: ParsedCVSS = {};
    metrics.forEach((metric) => {
        const [key, value] = metric.split(":");
        if (key && value) parsed[key] = value;
    });
    return parsed;
}

interface CVSSExplanationProps { vector: string; }

export const CVSSExplanation: React.FC<CVSSExplanationProps> = ({ vector }) => {
    const parsed = parseCVSSVector(vector);

    return (
        <Box 
            padding={4}
            border="1px solid"
            borderColor="gray.200"
            borderRadius={8}
        >
            <Text fontWeight={600}>CVSS Vector</Text>
            <Text fontSize={12} color="gray" marginBottom={2}>{vector}</Text>
            
            <Stack gap={0.5}>
                {Object.entries(parsed).map(([metric, value]) => {
                    const name = cvssMetricNames[metric] || metric;
                    const description = cvssMetrics[metric]?.[value] || cvssTemporalMetrics[metric]?.[value] || "Unknown metric/value";

                    return (
                        <Flex gap={4}>
                             <Text textAlign="right" color="gray.500" width={10}>({metric})</Text> <strong style={{ width: "160px" }}>{name}</strong>  {description}
                        </Flex>
                    )
                })}
            </Stack>
        </Box>
    );
}