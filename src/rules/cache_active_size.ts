import type { RuleResult } from "./types.ts";
import type { ActionsCacheUsage } from "../../packages/github/github.ts";

const THRESHOLD_CACHE_SIZE_GB = 9;

const meta = {
  ruleId: "actions-scanner/cache_active_size",
  ruleUrl: undefined,
  fixable: false,
};

// deno-lint-ignore require-await
export async function reportActiveCache(
  activeCache: ActionsCacheUsage,
): Promise<RuleResult[]> {
  const activeCacheSize =
    (activeCache.active_caches_size_in_bytes / 1000 / 1000 / 1000)
      .toPrecision(2);

  return [{
    ...meta,
    severity: (Number(activeCacheSize) > THRESHOLD_CACHE_SIZE_GB)
      ? "medium"
      : "low",
    messages: [
      `Active Cache size in bytes(GB): ${activeCacheSize} (MAX 10GB)`,
    ],
    data: activeCache,
  }];
}
