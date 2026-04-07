import { withApiHandler } from "@/lib/api";
import { redisClient } from "@/lib/redis";
import { formatTimeAgo } from "@/lib/utils/dates";

const REDIS_KEY = "threathub:health:ingestor-last-check-in";
const FIVE_MINUTES_MS = 5 * 60 * 1000;

export default withApiHandler(
    async (req, res) => {
        const value = await redisClient.get(REDIS_KEY);

        if (!value) {
            return res.status(500).json({
                error: "No check-in timestamp found"
            });
        }

        const lastCheckIn = new Date(value as string);

        if (Number.isNaN(lastCheckIn.getTime())) {
            return res.status(500).json({
                error: "Invalid timestamp format"
            });
        }

        const now = Date.now();
        const diff = now - lastCheckIn.getTime();

        if (diff <= FIVE_MINUTES_MS) {
            return res.status(200).json({
                status: true,
                lastCheckIn: lastCheckIn.toISOString(),
                age: diff,
                ageText: formatTimeAgo(diff)
            });
        }

        return res.status(500).json({
            status: false,
            lastCheckIn: lastCheckIn.toISOString(),
            age: diff,
            ageText: formatTimeAgo(diff)
        });
    },
    {
        methods: ["GET", "HEAD", "OPTIONS"],
        authRequired: false
    }
);