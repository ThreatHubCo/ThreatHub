import { log } from "@/lib/log";
import dotenv from "dotenv";
import packageJson from "../package.json";

dotenv.config({ quiet: true });

const banner = `
  _______ _                    _   _    _       _                 
 |__   __| |                  | | | |  | |     | |                 
    | |  | |__  _ __ ___  __ _| |_| |__| |_   _| |__    
    | |  | '_ \\| '__/ _ \\/ _\` | __|  __  | | | | '_ \\    
    | |  | | | | | |  __/ (_| | |_| |  | | |_| | |_) |  
    |_|  |_| |_|_|  \\___|\\__,_|\\__|_|  |_|\\__,_|_.__/ 
                                                                  
                                                                  
ThreatHub Web v${packageJson.version} by Luke (luke@glitch.je)
`;

async function init() {
    console.log(banner);
    log.info("Loading...");

    let pool;

    try {
        pool = (await import("./mysql")).pool;

        await pool.query("SELECT 1");
    } catch (e) {
        log.error("Failed to connect to MySQL: " + e.message);
        await pool.end();
        process.exit(1);
    }

    const { runMigrations } = await import("./runMigrations");
    await runMigrations(pool);

    const { loadJson } = await import("./importSoftware");
    await loadJson(pool);

    log.info("Shutting down MySQL connection...");
    await pool.end();

    log.info("Starting server...");
}

init().catch(console.error);