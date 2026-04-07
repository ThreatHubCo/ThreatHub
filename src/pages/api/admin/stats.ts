import { withApiHandler } from "@/lib/api";
import { AgentRole } from "@/lib/entities/Agent";
import { pool } from "@/lib/mysql";
import { redisClient } from "@/lib/redis";
import si from "systeminformation";

export default withApiHandler(async (req, res) => {
    const [rows] = await pool.execute(`
        SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 0) AS size_mb
        FROM information_schema.tables
        WHERE table_schema = DATABASE();
    `);

    const databaseSize = `${rows[0]?.size_mb ?? 0}MB`;

    const mem = await si.mem();
    const memoryUsedPercent = Math.round(
        ((mem.total - mem.available) / mem.total) * 100
    );

    const cpuLoad = await si.currentLoad();
    const cpuUsage = `${Math.round(cpuLoad.currentLoad)}%`;

    const disks = await si.fsSize();
    const rootDisk = disks.find(d => d.mount === "/") ?? disks[0];
    const diskUsage = `${Math.round(rootDisk.use)}%`;

    const ingestorLastCheckIn = await redisClient.get("threathub:health:ingestor-last-check-in");

    res.status(200).json({
        databaseSize,
        memoryUsage: `${memoryUsedPercent}%`,
        cpuUsage,
        diskUsage,
        ingestorLastCheckIn
    });
}, {
    methods: ["GET"],
    authRequired: true,
    requiredRole: AgentRole.ADMIN
});