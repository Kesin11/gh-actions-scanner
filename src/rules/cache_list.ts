import type { RuleResult } from "./types.ts";
import type { ActionsCacheList } from "../../packages/github/github.ts";

const meta = {
  ruleId: "actions-scanner/cache_list",
  ruleUrl: undefined,
  fixable: false,
};

// deno-lint-ignore require-await
export async function reportCacheList(
  cacheList: ActionsCacheList,
): Promise<RuleResult[]> {
  const topCacheList = cacheList.actions_caches.slice(0, 4);
  // console.debug(topCacheList.map((cache) => {
  //   return {
  //     ref: cache.ref,
  //     key: cache.key,
  //     size_in_bytes: cache.size_in_bytes,
  //   };
  // }));

  return [{
    ...meta,
    description: "Top 5 cache list",
    severity: "low",
    messages: topCacheList.map((cache) =>
      `${cache.ref}: ${cache.size_in_bytes}, key: ${cache.key}, size: ${cache.size_in_bytes} bytes`
    ),
    data: topCacheList,
  }];
}
