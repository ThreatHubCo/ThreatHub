import { pool } from "@/lib/mysql";
import { DEFAULT_CONFIG } from "@/lib/config/configDefaults";
import { ConfigItem, ConfigKey } from "../entities/Config";

export async function getAllConfig(): Promise<Record<ConfigKey, any>> {
    const [rows] = await pool.query("SELECT * FROM config");
    const items = rows as ConfigItem[];

    const config: Record<string, any> = {};

    for (const item of items) {
        switch (item.type) {
            case "boolean":
                config[item.key] = item.value === "true";
                break;
            case "number":
                config[item.key] = Number(item.value);
                break;
            case "json":
                try {
                    config[item.key] = JSON.parse(item.value);
                } catch {
                    config[item.key] = null;
                }
                break;
            default:
                config[item.key] = item.value;
        }
    }

    // Merge in any missing defaults
    for (const key of Object.keys(DEFAULT_CONFIG)) {
        if (!(key in config)) {
            config[key] = DEFAULT_CONFIG[key].value;
        }
    }

    return config;
}

export async function setConfigValue(key: string, value: any, type?: "string" | "boolean" | "number" | "json") {
    const configType = type || (typeof value === "boolean" ? "boolean" : typeof value === "number" ? "number" : "string");
    const strValue = configType === "json" ? JSON.stringify(value) : String(value);

    // The backticks on key are intentional because key is a reserved keyword in mysql
    await pool.query(`
        INSERT INTO config (\`key\`, value, type) VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE value = ?, type = ?
    `,
        [key, strValue, configType, strValue, configType]
    );
}

export async function updateConfig(updates: Record<string, any>) {
    for (const key of Object.keys(updates)) {
        const defaultType = DEFAULT_CONFIG[key]?.type ?? "string";
        await setConfigValue(key, updates[key], defaultType);
    }
    return getAllConfig();
}
