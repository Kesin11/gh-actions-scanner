import { ActionsCacheList, ActionsCacheUsage } from "../github.ts";

export function reportActiveCache(
  activeCache: ActionsCacheUsage,
) {
  console.log("----Actions active cache----");
  // console.log(activeCache);
  const activeCacheSize =
    (activeCache.active_caches_size_in_bytes / 1000 / 1000 / 1000)
      .toPrecision(2);
  console.log(
    `Active Cache size in bytes(GB): ${activeCacheSize} (MAX 10GB)`,
  );
}

export function reportCacheList(
  cacheList: ActionsCacheList,
) {
  console.log(
    `----Actions cache list (size top ${cacheList.actions_caches.length})----`,
  );
  console.debug(cacheList.actions_caches.map((cache) => {
    return {
      ref: cache.ref,
      key: cache.key,
      size_in_bytes: cache.size_in_bytes,
    };
  }));
}
