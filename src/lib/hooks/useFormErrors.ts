import { useState } from "react";

export function useFormErrors() {
    const [errors, setErrors] = useState<Record<string, string>>({});

    function getError(field: string) {
        return errors[field] || null;
    }

    function hasError(field: string) {
        return !!errors[field];
    }

    function clearError(field: string) {
        setErrors((prev) => {
            const updated = { ...prev };
            delete updated[field];
            return updated;
        });
    }

    function clearAllErrors() {
        setErrors({});
    }

    async function checkApiErrors(res) {
        let data;

        try {
            data = await res.json();
        } catch (err) {
            data = null;
        }

        if (!res.ok) {
            if (data?.validationError && data.errors) {
                setErrors(data.errors || {});
                throw new Error("Failed to complete the request");
            }

            if (data?.error) {
                throw new Error(data.error);
            }

            const text = data === null ? await res.text().catch(() => "") : "";
            throw new Error(text || `Request failed with status ${res.status}`);
        }
        return data;
    }

    return {
        errors,
        getError,
        hasError,
        clearError,
        clearAllErrors,
        checkApiErrors
    }
}