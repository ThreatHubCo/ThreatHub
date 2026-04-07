import { withApiHandler } from "@/lib/api";
import { ScanJob, ScanStatus, ScanType } from "@/lib/entities/ScanJob";
import { redisClient } from "@/lib/redis";
import { v4 as uuid } from "uuid";

export default withApiHandler(async (req, res, session) => {
    const { type, targetType, targetId } = req.body as {
        type: ScanType;
        targetType?: ScanJob["targetType"];
        targetId?: string;
    };

    if (!type) {
        return res.status(400).json({ error: "Scan type required" });
    }

    const job: ScanJob = {
        id: uuid(),
        type,
        targetType,
        targetId,
        requestedBy: session.user.id,
        status: ScanStatus.PENDING,
        progress: 0,
        message: "Job created",
        createdAt: Date.now().toString(),
    };  

    await redisClient.hSet("threathub:jobs:all", job.id, JSON.stringify(job));
    await redisClient.lPush("threathub:jobs:queue", job.id);

    return res.status(200).json({ jobId: job.id });
}, {
    methods: ["POST"]
});
