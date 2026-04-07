import type { NextConfig } from "next";
import { execSync } from "child_process";
import packageJson from "./package.json";

function getGitCommit() {
    try {
        return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    } catch {
        return "unknown";
    }
}

const nextConfig: NextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    productionBrowserSourceMaps: false,
    env: {
        NEXT_PUBLIC_VERSION: packageJson.version,
        NEXT_PUBLIC_AUTHOR: packageJson.author,
        NEXT_PUBLIC_GIT_COMMIT: getGitCommit()
    }
}

export default nextConfig;
