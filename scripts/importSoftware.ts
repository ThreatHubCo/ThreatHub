import path from "path";
import fs from "fs/promises";
import dotenv from "dotenv";
import { log } from "@/lib/log";

dotenv.config({ quiet: true });

export async function loadJson(pool) {
    log.info("Starting Software Map import...");

    try {
        const filePath = path.join(process.cwd(), "data/software-map.json");
        const raw = await fs.readFile(filePath, "utf-8");
        const data = JSON.parse(raw);

        const softwareEntries = Object.entries(data.software);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const [key, software] of softwareEntries) {
            const { name, vendor, summary } = software as any;

            const [result] = await pool.query(`UPDATE software SET formatted_name = ?, formatted_vendor = ?, summary = ? WHERE name = ?`,
                [name, vendor, summary ?? null, key]
            );

            const affected = (result as any).affectedRows;

            if (affected === 0) {
                skippedCount++;
            } else {
                updatedCount++;
            }
        }

        log.info(`Software map import complete: ${updatedCount} updated, ${skippedCount} skipped`);
    } catch (e) {
        log.warn("Software map (data/software-map.json) not found or is unreadable");
        log.warn("Error message: " + e.message);
    }
}

async function runDirectly() {
    let pool;

    try {
        pool = (await import("./mysql")).pool;
        await loadJson(pool);
    } catch (e) {
        log.error("Failed to connect to MySQL: " + e.message);
        process.exit(1);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

// Run if invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runDirectly();
}
