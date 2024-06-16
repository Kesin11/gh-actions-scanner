import type { RuleArgs, RuleResult } from "./types.ts";

const TOP_N = 10;

const meta = {
  ruleId: "actions-scanner/cache_list",
  ruleUrl: undefined,
  fixable: false,
};

// deno-lint-ignore require-await
export async function reportCacheList(
  { actionsCacheList }: RuleArgs,
): Promise<RuleResult[]> {
  const topCacheList = actionsCacheList.actions_caches.slice(0, TOP_N - 1);
  // console.debug(topCacheList.map((cache) => {
  //   return {
  //     ref: cache.ref,
  //     key: cache.key,
  //     size_in_bytes: cache.size_in_bytes,
  //   };
  // }));

  if (topCacheList.length === 0) return [];

  return [{
    ...meta,
    description: `List Top ${TOP_N} cache size`,
    severity: "low",
    messages: topCacheList.map((cache) =>
      `${cache.ref}: key: ${cache.key}, size: ${cache.size_in_bytes} bytes`
    ),
    data: topCacheList,
  }];
}
