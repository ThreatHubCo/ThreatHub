import { withApiHandler } from "@/lib/api";
import { redisClient } from "@/lib/redis";

export default withApiHandler(async (req, res, session) => {
    const { jobId, targetType, targetId } = req.query as {
        jobId?: string;
        targetType?: string;
        targetId?: string;
    };

    const allJobsRaw = await redisClient.hGetAll("threathub:jobs:all");
    const jobs = Object.values(allJobsRaw).map((j: any) => JSON.parse(j));

    let filtered = jobs;

    if (jobId) filtered = filtered.filter(j => j.id === jobId);
    if (targetType) filtered = filtered.filter(j => j.targetType === targetType);
    if (targetId) filtered = filtered.filter(j => j.targetId === targetId);

    return res.status(200).json(filtered);
}, { 
    methods: ["GET"] 
});
