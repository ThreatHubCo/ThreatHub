import { Software } from "../entities/Software";
import softwareMap from "@/data/software-map.json";

export interface SoftwareMap {
    [id: string]: SoftwareMapItem;
}

export interface SoftwareMapItem {
    name: string;
    vendor: string;
    type: string;
    summary: string;
}

function formatType(type: string) {
    switch (type) {
        case "APPLICATION": return "Application";
        case "OPERATING_SYSTEM": return "Operating System";
        case "DRIVER": return "Driver";
        case "LIBRARY": return "Software Library";
        case "APPLICATION_SUITE": return "Application Suite";
        case "RUNTIME": return "Runtime";
        case "FRAMEWORK": return "Dev Framework";
    }
    return type;
}

// TODO: This is being phased out to be replaced with the formatted names in the database
export function findSoftwareInfo(software: Software & any): SoftwareMapItem {
    const entry = softwareMap[software.defender_name || software.name];

    if (entry) {
        return {
            name: entry.name,
            vendor: entry.vendor,
            type: formatType(entry.type),
            summary: entry.summary
        }
    }

    return {
        name: software.name,
        vendor: software.vendor,
        type: "Unknown",
        summary: ""
    }
}