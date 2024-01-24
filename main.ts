import { createJobsSummary, createRunsSummary, Github } from "./src/github.ts";
import { reportActiveCache, reportCacheList } from "./src/rules/cache.ts";
import {
  reportWorkflowCount,
  reportWorkflowRetryRuns,
  reportWorkflowUsage,
} from "./src/rules/workflow.ts";

const fullname = Deno.args[0];
const perPage = Deno.args[1] ? parseInt(Deno.args[1]) : 20; // gh run list もデフォルトでは20件表示
const [owner, repo] = fullname.split("/");
const github = new Github();
const workflowRuns = await github.fetchWorkflowRuns(owner, repo, perPage);
console.dir(workflowRuns, { depth: null });
const workflowRunUsages = await github.fetchWorkflowRunUsages(workflowRuns);
const workflowJobs = await github.fetchWorkflowJobs(workflowRuns);

const workflowFiles = await github.fetchWorkflowFiles(workflowRuns);
console.log(workflowFiles);

const runsSummary = createRunsSummary(
  workflowRuns,
  workflowRunUsages,
  workflowFiles,
);
console.log("----runsSummary----");
console.dir(runsSummary, { depth: null });
console.log("----jobsSummary----");
const jobsSummary = createJobsSummary(runsSummary, workflowJobs);
console.dir(jobsSummary, { depth: null });

await reportWorkflowRetryRuns(runsSummary);
await reportWorkflowCount(runsSummary);
await reportWorkflowUsage(runsSummary);

const cacheUsage = await github.fetchActionsCacheUsage(owner, repo);
const cacheList = await github.fetchActionsCacheList(owner, repo, 5);
reportActiveCache(cacheUsage);
reportCacheList(cacheList);
