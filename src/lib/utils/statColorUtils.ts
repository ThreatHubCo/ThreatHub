type StatColors = {
    bgColor: string
    color: string
}

export function getRiskColors(
    value: number | string,
    type: "severity" | "epss"
): StatColors {
    if (!value) {
        return { bgColor: "gray.200", color: "gray.700" }
    }
    if (type === "severity") {
        const severity = value.toString().toLowerCase()

        if (severity === "critical" || severity === "high") {
            return { bgColor: "red.100", color: "red.700" }
        }
        if (severity === "medium") {
            return { bgColor: "orange.100", color: "orange.700" }
        }
        return { bgColor: "green.100", color: "green.700" }
    }

    const epss = typeof value === "number" ? value : Number(value)

    if (epss >= 0.50) {
        return { bgColor: "red.100", color: "red.700" }
    }
    if (epss >= 0.10) {
        return { bgColor: "orange.100", color: "orange.700" }
    }
    return { bgColor: "green.100", color: "green.700" }
}