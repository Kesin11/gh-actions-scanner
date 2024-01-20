import { Octokit } from "npm:@octokit/rest@20.0.2";

export async function reportActiveCache(
  octokit: Octokit,
  owner: string,
  repo: string,
) {
  console.log("----Actions active cache----");
  const activeCache = await octokit.actions.getActionsCacheUsage({
    owner,
    repo,
  });
  // console.log(activeCache.data);
  const activeCacheSize =
    (activeCache.data.active_caches_size_in_bytes / 1000 / 1000 / 1000)
      .toPrecision(2);
  console.log(
    `Active Cache size in bytes(GB): ${activeCacheSize} (MAX 10GB)`,
  );
}

export async function reportCacheList(
  octokit: Octokit,
  owner: string,
  repo: string,
) {
  console.log("----Actions cache list (size top 5)----");
  const caches = await octokit.actions.getActionsCacheList({
    owner,
    repo,
    sort: "size_in_bytes",
    per_page: 5,
  });
  console.debug(caches.data.actions_caches.map((cache) => {
    return {
      ref: cache.ref,
      key: cache.key,
      size_in_bytes: cache.size_in_bytes,
    };
  }));
}
