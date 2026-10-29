type ComparisonOperator = "=" | ">" | "<";

export class WhereBuilder {
    private conditions: string[] = [];
    private params: unknown[] = [];

    add(condition: string, ...params: unknown[]): this {
        this.conditions.push(condition);
        this.params.push(...params);

        return this;
    }

    addIf(condition: boolean, sql: string, ...params: unknown[]): this {
        if (condition) {
            this.add(sql, ...params);
        }
        return this;
    }

    like(column: string, value?: string): this {
        if (value) {
            this.add(`${column} LIKE ?`, `%${value}%`);
        }
        return this;
    }

    equals(column: string, value: unknown): this {
        this.add(`${column} = ?`, value);
        return this;
    }

    numberFilter(column: string, value?: string): this {
        if (!value) {
            return this;
        }

        const operator = value[0] as ComparisonOperator;
        const number = Number(value.slice(1));

        if (!["=", ">", "<"].includes(operator) || Number.isNaN(number)) {
            return this;
        }

        this.add(`${column} ${operator} ?`, number);
        return this;
    }

    build(clause: "WHERE" | "HAVING" = "WHERE"): {
        sql: string;
        params: unknown[];
        conditions: string[];
    } {
        return {
            sql: this.conditions.length ? `${clause} ${this.conditions.join(" AND ")}` : "",
            params: [...this.params],
            conditions: [...this.conditions]
        };
    }
}