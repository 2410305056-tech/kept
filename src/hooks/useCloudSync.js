import { useEffect } from "react";
import { isCloudConfigured, startCloudSync } from "../lib/cloud.js";

export function useCloudSync() {
  useEffect(() => {
    if (!isCloudConfigured()) return undefined;
    return startCloudSync();
  }, []);
}
