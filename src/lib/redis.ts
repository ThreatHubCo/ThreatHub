import { createClient } from "redis";
import { log } from "./log";

const globalRedis = globalThis;

export const redisClient = globalRedis.redisClient ?? createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

if (!globalRedis.redisClient) {
    globalRedis.redisClient = redisClient;

    redisClient.on("error", (err) =>
        log.error("Redis Client Error", err)
    );

    redisClient.connect()
        .then(() => log.info("Redis connected"))
        .catch(console.error);
}