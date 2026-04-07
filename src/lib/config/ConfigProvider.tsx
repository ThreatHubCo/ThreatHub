import { SkeletonPage } from "@/components/ui/SkeletonPage";
import { useEffect, useState } from "react";
import { ConfigContext, ConfigMap } from "./ConfigContext";

export function ConfigProvider({ children }) {
    const [config, setConfig] = useState<ConfigMap>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/config")
            .then(res => res.json())
            .then(setConfig)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <SkeletonPage />
    }

    return (
        <ConfigContext.Provider value={config}>
            {children}
        </ConfigContext.Provider>
    )
}