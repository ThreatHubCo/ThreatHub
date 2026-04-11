import { useEffect, useState } from "react";
import { ScanJob } from "../entities/ScanJob";

export function useScanJobs(pollInterval = 1000) {
    const [jobs, setJobs] = useState<ScanJob[]>([]);

    useEffect(() => {
        let cancelled = false;

        async function fetchJobs() {
            try {
                const res = await fetch("/api/scan/status");
                const data: ScanJob[] = await res.json();

                if (!cancelled && Array.isArray(data)) {
                    setJobs(data);
                }
            } catch (e) {
                console.error("Failed to fetch scan jobs", e);
            }
        }

        fetchJobs();
        const interval = setInterval(fetchJobs, pollInterval);

        return () => {
            cancelled = true;
            clearInterval(interval);
        }
    }, [pollInterval]);

    return jobs;
}
