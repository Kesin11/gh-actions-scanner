import {
  createJobsSummary,
  createOctokit,
  createRunsSummary,
  fetchWorkflowRuns,
  fetchWorkflowRunUsages,
} from "./src/github.ts";
import { reportActiveCache, reportCacheList } from "./src/rules/cache.ts";
import {
  reportWorkflowCount,
  reportWorkflowRetryRuns,
  reportWorkflowUsage,
} from "./src/rules/workflow.ts";

const fullname = Deno.args[0];
const perPage = Deno.args[1] ? parseInt(Deno.args[1]) : 20; // gh run list もデフォルトでは20件表示
const [owner, repo] = fullname.split("/");
const octokit = createOctokit();
const workflowRuns = await fetchWorkflowRuns(octokit, owner, repo, perPage);
const workflowRunUsages = await fetchWorkflowRunUsages(octokit, workflowRuns);

const runsSummary = createRunsSummary(workflowRuns, workflowRunUsages);
console.log("----runsSummary----");
console.dir(runsSummary, { depth: null });
console.log("----jobsSummary----");
const jobsSummary = await createJobsSummary(octokit, runsSummary);
console.dir(jobsSummary, { depth: null });

await reportWorkflowRetryRuns(runsSummary);
await reportWorkflowCount(runsSummary);
await reportWorkflowUsage(runsSummary);

await reportActiveCache(octokit, owner, repo);
await reportCacheList(octokit, owner, repo);
