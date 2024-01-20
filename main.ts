import {
  createJobsSummary,
  createOctokit,
  createRunsSummary,
} from "./src/github.ts";
import { reportActiveCache, reportCacheList } from "./src/rules/cache.ts";
import {
  reportWorkflowCount,
  reportWorkflowRetryRuns,
  reportWorkflowUsage,
} from "./src/rules/workflow.ts";

const fullname = Deno.args[0];
const [owner, repo] = fullname.split("/");
export const octokit = createOctokit();

const runsSummary = await createRunsSummary(octokit, owner, repo);
console.log("----runsSummary----");
// console.debug(runsSummary);
console.log("----jobsSummary----");
const jobsSummary = await createJobsSummary(octokit, runsSummary);
console.debug(jobsSummary);

await reportWorkflowRetryRuns(runsSummary);
await reportWorkflowCount(runsSummary);
await reportWorkflowUsage(runsSummary);

// await reportActiveCache(octokit, owner, repo);
// await reportCacheList(octokit, owner, repo);
