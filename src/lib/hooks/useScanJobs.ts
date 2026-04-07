import { useEffect, useState } from "react";
import { ScanJob } from "../entities/ScanJob";

export function useScanJobs(pollInterval = 1000) {
    const [jobs, setJobs] = useState<ScanJob[]>([]);

    useEffect(() => {
        let cancelled = false;

        const fetchJobs = async () => {
            const res = await fetch("/api/scan/status");
            const data: ScanJob[] = await res.json();
            
            if (!cancelled && Array.isArray(data)) {
                setJobs(data);
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
