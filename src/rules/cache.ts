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
  console.log(activeCache.data);
  console.log(
    `Active Cache size in bytes(GB): ${
      Math.round(
        activeCache.data.active_caches_size_in_bytes / 1000 / 1000 / 1000,
      )
    } / 10GB`,
  );
}

export async function reportCacheList(
  octokit: Octokit,
  owner: string,
  repo: string,
) {
  console.log("----Actions cache list (size top 10)----");
  const caches = await octokit.actions.getActionsCacheList({
    owner,
    repo,
    sort: "size_in_bytes",
    per_page: 10,
  });
  console.log(caches.data);
}
