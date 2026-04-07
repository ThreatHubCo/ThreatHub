export class DuplicateError extends Error {
    field?: string;

    constructor(message: string, field?: string) {
        super(message);
        this.name = "DuplicateError";
        this.field = field;
    }
}