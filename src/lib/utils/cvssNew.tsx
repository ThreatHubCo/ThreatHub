import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import React from "react";

type ParsedCVSS = Record<string, string>;

interface ParsedResult {
    version: string;
    metrics: ParsedCVSS;
}

const metricNamesV3: Record<string, string> = {
    AV: "Attack Vector",
    AC: "Attack Complexity",
    PR: "Privileges Required",
    UI: "User Interaction",
    S: "Scope",
    C: "Confidentiality Impact",
    I: "Integrity Impact",
    A: "Availability Impact",
    E: "Exploit Code Maturity",
    RL: "Remediation Level",
    RC: "Report Confidence"
};

const metricNamesV4: Record<string, string> = {
    AV: "Attack Vector",
    AC: "Attack Complexity",
    AT: "Attack Requirements",
    PR: "Privileges Required",
    UI: "User Interaction",
    VC: "Vulnerability Confidentiality Impact",
    VI: "Vulnerability Integrity Impact",
    VA: "Vulnerability Availability Impact",
    SC: "System Confidentiality Impact",
    SI: "System Integrity Impact",
    SA: "System Availability Impact",
    E: "Exploit Maturity",
    CR: "Confidentiality Requirement",
    IR: "Integrity Requirement",
    AR: "Availability Requirement",
    S: "Safety",
    AU: "Automatable",
    R: "Recovery",
    V: "Value Density",
    RE: "Response Effort",
    U: "Urgency",
    MAV: "Modified Attack Vector",
    MAC: "Modified Attack Complexity",
    MAT: "Modified Attack Requirements",
    MPR: "Modified Privileges Required",
    MUI: "Modified User Interaction",
    MVC: "Modified Vulnerability Confidentiality",
    MVI: "Modified Vulnerability Integrity",
    MVA: "Modified Vulnerability Availability",
    MSC: "Modified System Confidentiality",
    MSI: "Modified System Integrity",
    MSA: "Modified System Availability"
}

const cvssV3Metrics: Record<string, Record<string, string>> = {
    AV: { N: "Network", A: "Adjacent", L: "Local", P: "Physical" },
    AC: { L: "Low", H: "High" },
    PR: { N: "None", L: "Low", H: "High" },
    UI: { N: "None", R: "Required" },
    S: { U: "Unchanged", C: "Changed" },
    C: { H: "High", L: "Low", N: "None" },
    I: { H: "High", L: "Low", N: "None" },
    A: { H: "High", L: "Low", N: "None" }
}

const cvssV3Temporal: Record<string, Record<string, string>> = {
    E: { X: "Not defined", U: "Unproven", P: "PoC exists", F: "Functional", H: "Widespread" },
    RL: { X: "Not defined", O: "Official fix", T: "Temporary fix", W: "Workaround", U: "Unavailable" },
    RC: { X: "Not defined", U: "Unknown", R: "Reasonable", C: "Confirmed" }
}

const cvssV4Metrics: Record<string, Record<string, string>> = {
    AV: { N: "Network", A: "Adjacent", L: "Local", P: "Physical" },
    AC: { L: "Low", H: "High" },
    AT: { N: "None", P: "Present" },
    PR: { N: "None", L: "Low", H: "High" },
    UI: { N: "None", P: "Passive", A: "Active" },

    VC: { H: "High", L: "Low", N: "None" },
    VI: { H: "High", L: "Low", N: "None" },
    VA: { H: "High", L: "Low", N: "None" },

    SC: { H: "High", L: "Low", N: "None" },
    SI: { H: "High", L: "Low", N: "None" },
    SA: { H: "High", L: "Low", N: "None" },

    E: { X: "Not defined", U: "Unreported", P: "Proof-of-concept", A: "Attacked" }
}

export function parseCVSSVector(vector: string): ParsedResult {
    const versionMatch = vector.match(/^CVSS:(\d\.\d)/);
    const version = versionMatch ? versionMatch[1] : "unknown";

    const metrics = vector.replace(/^CVSS:\d\.\d\//, "").split("/");
    const parsed: ParsedCVSS = {};

    metrics.forEach((metric) => {
        const [key, value] = metric.split(":");

        if (key && value) {
            parsed[key] = value;
        }
    });

    return {
        version,
        metrics: parsed
    }
}

interface CVSSExplanationProps {
    vector: string;
}

export function CVSSExplanation({ vector }: CVSSExplanationProps) {
    const { version, metrics } = parseCVSSVector(vector);

    const isV4 = version.startsWith("4");

    const metricMap = isV4 ? cvssV4Metrics : cvssV3Metrics;
    const temporalMap = isV4 ? {} : cvssV3Temporal;

    const filteredMetrics = Object.entries(metrics).filter(([_, value]) => value !== "X");

    return (
        <Box
            padding={4}
            border="1px solid"
            borderColor="gray.200"
            borderRadius={8}
        >
            <Text fontWeight={600}>
                CVSS Vector (v{version})
            </Text>

            <Text fontSize={12} color="gray" marginBottom={2}>
                {vector}
            </Text>

            <Stack gap={0.5}>
                {filteredMetrics.map(([metric, value]) => {
                    const nameMap = version.startsWith("4") ? metricNamesV4 : metricNamesV3;
                    const name = nameMap[metric] || metric;
                    const description = metricMap[metric]?.[value] || temporalMap[metric]?.[value] || `Unknown (${value})`;

                    return (
                        <Flex key={metric} gap={4}>
                            <Text textAlign="right" color="gray.500" width={10}>
                                ({metric})
                            </Text>

                            <Text fontWeight={600} width="200px">
                                {name}
                            </Text>

                            <Text>{description}</Text>
                        </Flex>
                    );
                })}
            </Stack>
        </Box>
    );
}