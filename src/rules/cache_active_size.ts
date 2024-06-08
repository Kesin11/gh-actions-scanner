import type { RuleArgs, RuleResult } from "./types.ts";
import type { ActionsCacheUsage } from "../../packages/github/github.ts";

export const THRESHOLD_CACHE_SIZE_GB = 9;

const meta = {
  ruleId: "actions-scanner/cache_active_size",
  fixable: false,
};

// deno-lint-ignore require-await
export async function reportActiveCache(
  { actionsCacheUsage }: RuleArgs,
): Promise<RuleResult[]> {
  const activeCacheSize =
    (actionsCacheUsage.active_caches_size_in_bytes / 1024 / 1024 / 1024)
      .toPrecision(2);

  const ruleResult = (Number(activeCacheSize) >= THRESHOLD_CACHE_SIZE_GB)
    ? reportCacheReachLimit(actionsCacheUsage, activeCacheSize)
    : reportCache(actionsCacheUsage, activeCacheSize);

  return [ruleResult];
}

function reportCache(
  activeCache: ActionsCacheUsage,
  activeCacheSize: string,
): RuleResult {
  return {
    ...meta,
    severity: "low",
    description: "Show active cache size",
    messages: [
      `Active Cache size in bytes(GB): ${activeCacheSize} (MAX 10GB)`,
    ],
    data: activeCache,
  };
}

function reportCacheReachLimit(
  activeCache: ActionsCacheUsage,
  activeCacheSize: string,
): RuleResult {
  return {
    ...meta,
    severity: "medium",
    description: "Cache size will soon reach its MAX limit",
    messages: [
      `Cache size will soon reach its MAX limit. It's using ${activeCacheSize}GB / 10GB`,
      // TODO: こういうURLを表示させたい
      // `See repository cache list. https://github.com/kesin11-private/gh-actions-scanner/actions/caches`
    ],
    helpMessage: `Recommend to reduce cache size.`,
    data: activeCache,
  };
}
