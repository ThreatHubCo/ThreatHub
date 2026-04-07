import { Severity, Vulnerability } from "@/lib/entities/Vulnerability";
import { Button, Center, Spinner, StackSeparator, Table, Text, VStack } from "@chakra-ui/react";
import { BooleanCell } from "../cell/BooleanCell";
import { SeverityCell } from "../cell/SeverityCell";
import { DateTextWithHover } from "./DateTextWithHover";

interface Props {
    vulnerabilities: Vulnerability[];
    totalVulnerabilities: number;
    onShowAll: () => void;
    capped?: boolean;
    hideVerifiedExploit?: boolean;
    onClickViewInfo?: (vuln: Vulnerability) => void;
}

const CVE_CAP = 50;

export function DrawerCVEList({
    vulnerabilities,
    totalVulnerabilities,
    capped,
    hideVerifiedExploit,
    onShowAll,
    onClickViewInfo
}: Props) {

    if (!vulnerabilities || vulnerabilities.length === 0) {
        return (
            <Center>
                <Spinner />
            </Center>
        )
    }

    return (
        <>
            <Text fontSize="xs" color="fg.muted" marginBottom={2}>
                {capped ? `Showing first ${CVE_CAP} of ${totalVulnerabilities} vulnerabilities` : `Showing all ${totalVulnerabilities} vulnerabilities`}
            </Text>

            <VStack
                align="start"
                gap={1}
                marginTop={2}
                separator={<StackSeparator />}
            >
                <Table.Root size="sm">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeader>CVE</Table.ColumnHeader>
                            <Table.ColumnHeader>Severity</Table.ColumnHeader>
                            <Table.ColumnHeader width="90px">Public Exploit</Table.ColumnHeader>
                            {!hideVerifiedExploit && <Table.ColumnHeader width="100px">Verified Exploit</Table.ColumnHeader>}
                            <Table.ColumnHeader>Created</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {vulnerabilities.map(vuln => (
                            <Table.Row key={vuln.id}>
                                <Table.Cell>{vuln.cve_id}</Table.Cell>
                                <Table.Cell>
                                    <SeverityCell severity={vuln.severity as Severity} />
                                </Table.Cell>
                                <Table.Cell>
                                    <BooleanCell value={vuln.public_exploit} />
                                </Table.Cell>
                                {!hideVerifiedExploit && (
                                    <Table.Cell>
                                        <BooleanCell value={vuln.exploit_verified} />
                                    </Table.Cell>
                                )}
                                <Table.Cell>
                                    <DateTextWithHover date={vuln.created_at} reverse withTime />
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            </VStack>

            {(capped && vulnerabilities.length > 0) && (
                <Button
                    size="xs"
                    variant="outline"
                    onClick={() => onShowAll()}
                    marginTop={4}
                >
                    Load all {totalVulnerabilities} vulnerabilities
                </Button>
            )}
        </>
    )
}

