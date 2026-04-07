import { Text } from "@chakra-ui/react";
import { Agent, AgentRole } from "../entities/Agent";

export const roleToInt = {
    [AgentRole.VIEWER]: 0,
    [AgentRole.MANAGER]: 10,
    [AgentRole.ADMIN]: 20
}

export function checkAgentRole(session: { agent: Agent }, requiredRole: AgentRole) {
    const currentRoleInt = roleToInt[session.agent.role];
    const targetRoleInt = roleToInt[requiredRole];

    if (!session || !session.agent || !session?.agent?.role || currentRoleInt < targetRoleInt) {
        return false;
    }
    return true;
}

export interface NumberFilterTarget {
    value?: string;
    column: string;
}

export interface NumberFilterResult {
    conditions: string[];
    params: number[];
}

export function parseNumberFilters(targets: NumberFilterTarget[]): NumberFilterResult {
    const conditions: string[] = [];
    const params: number[] = [];

    for (const { value, column } of targets) {
        if (!value) {
            continue;
        }
        const operator = value[0];
        const number = Number(value.slice(1));

        if (!["=", ">", "<"].includes(operator)) {
            continue;
        }
        if (Number.isNaN(number)) {
            continue;
        }

        conditions.push(`${column} ${operator} ?`);
        params.push(number);
    }

    return { conditions, params }
}

export function truncateString(str: string, maxLength: number) {
    if (!str) {
        return str;
    }
    if (str.length <= maxLength) {
        return str;
    }
    return str.slice(0, maxLength) + '...';
}

export function formatAsPercent(value: number | string, decimalPlace: number = 2) {
    if (!value) {
        return "-";
    }
    const percentValue = Number(value) * 100;
    return `${percentValue.toFixed(decimalPlace)}%`;
}

export function formatVulnerabilityDescription(text: string) {
    const split = text.split(/(?=Summary:|Impact:|Remediation:)/g);

    if (split.length !== 3) {
        return text;
    }

    return (
        <>
            {split.map((section, i) => {
                const match = section.match(/^(Summary:|Impact:|Remediation:)\s*(.*)$/s);

                if (!match) return <p key={i}>{section}</p>;

                const [, title, content] = match;

                return (
                    <Text key={i}>
                        <strong>{title}</strong> {content}
                    </Text>
                )
            })}
        </>
    )
}

export function basicSqlQueryValidation(sql: string) {
    const trimmed = sql.trim().toLowerCase();

    // Only SELECT queries are allowed. This is restricted via the MySQL user itself,
    // this check is only for basic input validation and not for security
    if (!trimmed.startsWith("select")) {
        throw new Error("Only SELECT queries are allowed");
    }

    // A basic forbidden words check. This will catch things like "DELETE FROM table" but not "deleted_at"
    const forbidden = ["insert", "update", "delete", "drop", "alter", "truncate"];

    for (const word of forbidden) {
        const regex = new RegExp(`\\b${word}\\b`, "i");

        if (regex.test(trimmed)) {
            throw new Error(`Forbidden keyword: ${word}`);
        }
    }
}