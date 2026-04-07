import { ScanTargetType, ScanType } from "../entities/ScanJob";

export interface StartJobData {
    type: ScanType;
    targetType: ScanTargetType;
    targetId?: number;
}

export async function startScanJob(jobData: StartJobData) {
    const res = await fetch("/api/scan/start", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(jobData)
    });
    return { 
        ok: res.ok, 
        data: await res.json() 
    }
}