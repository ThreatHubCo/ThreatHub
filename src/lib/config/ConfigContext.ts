import { createContext, useContext } from "react";
import { ConfigKey } from "@/lib/entities/Config";

export type ConfigMap = Partial<Record<ConfigKey, string>>;

export const ConfigContext = createContext<ConfigMap | null>(null);

export function useConfig() {
    const ctx = useContext(ConfigContext);
    if (!ctx) {
        throw new Error("useConfig must be used within ConfigProvider");
    }
    return ctx;
}