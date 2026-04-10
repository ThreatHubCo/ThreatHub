import path from "path";
import fs from "fs/promises";
import dotenv from "dotenv";
import { log } from "@/lib/log";

dotenv.config({ quiet: true });

export async function runMigrations(pool) {
    log.info("Starting database migrations...");

    const migrationsDir = path.join(process.cwd(), "migrations");

    let appliedCount = 0;
    let skippedCount = 0;

    try {
        const [tableCheck] = await pool.query(`
            SELECT COUNT(*) as count FROM information_schema.tables
            WHERE table_schema = DATABASE() AND table_name = 'migrations'
        `);

        const isFresh = (tableCheck as any)[0].count === 0;

        // If the database is new then only run base.sql (as this contains the entire schema)
        if (isFresh) {
            log.info("Fresh database detected");

            const basePath = path.join(migrationsDir, "base.sql");

            try {
                const sql = await fs.readFile(basePath, "utf-8");

                log.info("Applying base.sql...");
                await pool.query(sql);

                // Create migrations table to track which migrations have been applied in the future 
                await pool.query(`
                    CREATE TABLE migrations (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) UNIQUE NOT NULL,
                        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                // Mark base as applied
                await pool.query("INSERT INTO migrations (name) VALUES ('base.sql')");

                appliedCount++;

                log.info("Base schema applied. Skipping other migrations.");
            } catch (e: any) {
                log.error("Failed to apply base.sql: " + e.message);
                process.exit(1);
            }

            return;
        }

        // If the migrations table already exists in the database then we don't run base.sql
        // and simply apply any extra migrations
        log.info("Existing database detected, checking migrations...");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const files = await fs.readdir(migrationsDir);
        const migrationFiles = files.filter(f => f.endsWith(".sql") && f !== "base.sql").sort();

        for (const file of migrationFiles) {
            const [rows] = await pool.query("SELECT 1 FROM migrations WHERE name = ? LIMIT 1", [file]);

            if ((rows as any[]).length > 0) {
                skippedCount++;
                continue;
            }

            const filePath = path.join(migrationsDir, file);
            const sql = await fs.readFile(filePath, "utf-8");

            log.info(`Applying migration: ${file}`);

            await pool.query(sql);
            await pool.query("INSERT INTO migrations (name) VALUES (?)", [file]);

            appliedCount++;
        }

        log.info(`Migrations complete: ${appliedCount} applied, ${skippedCount} skipped`);
    } catch (e: any) {
        log.error("Migration process failed: " + e.message);
        process.exit(1);
    }
}

async function runDirectly() {
    let pool;

    try {
        pool = (await import("./mysql")).pool;
        await runMigrations(pool);
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