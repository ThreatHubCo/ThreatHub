import { createClient } from "redis";
import { log } from "./log";

const globalRedis = globalThis as typeof globalThis & {
    redisClient?: ReturnType<typeof createClient>;
}

let redisClient: ReturnType<typeof createClient>;

try {
    const host = process.env.REDIS_HOST;
    const port = process.env.REDIS_PORT;

    if (!host || !port) {
        throw new Error("REDIS_HOST and REDIS_PORT must be configured");
    }

    const url = new URL(`redis://${host}:${port}`);

    redisClient = globalRedis.redisClient ?? createClient({
        url: url.toString()
    });

    if (!globalRedis.redisClient) {
        globalRedis.redisClient = redisClient;

        redisClient.on("error", (e) =>
            log.error("Redis Client Error", e)
        );

        redisClient.connect()
            .then(() => log.info("Redis connected"))
            .catch((e) => log.error("Failed to connect to Redis", e));
    }
} catch (err) {
    log.error("Failed to initialise Redis client", err);
    throw err;
}

export { redisClient }
