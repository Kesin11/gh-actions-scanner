import { Github } from "./packages/github/github.ts";
import {
  createJobsSummary,
  createRunsSummary,
} from "./src/workflow_summariser.ts";
import { reportCacheList } from "./src/rules/cache.ts";
import { reportActiveCache } from "./src/rules/reportActiveCache.ts";
import { reportWorkflowUsage } from "./src/rules/workflow_run_usage.ts";
import { reportWorkflowCount } from "./src/rules/workflow_count_stat.ts";
import { reportWorkflowRetryRuns } from "./src/rules/workflow_retry_runs.ts";
import { WorkflowModel } from "./src/workflow_file.ts";
import { checkSlowArtifactAction } from "./src/rules/artifact.ts";
import { checkCheckoutFilterBlobNone } from "./src/rules/checkout.ts";
import { checkTooShortBillableJob } from "./src/rules/job.ts";

const fullname = Deno.args[0];
const perPage = Deno.args[1] ? parseInt(Deno.args[1]) : 20; // gh run list もデフォルトでは20件表示
const [owner, repo] = fullname.split("/");
const github = new Github();
console.log(`owner: ${owner}, repo: ${repo}, perPage: ${perPage}`);
const workflowRuns = (await github.fetchWorkflowRuns(owner, repo, perPage))
  .filter((run) => run.event !== "dynamic"); // Ignore some special runs that have not workflow file. ex: CodeQL
console.dir(workflowRuns, { depth: null });
const workflowRunUsages = await github.fetchWorkflowRunUsages(workflowRuns);
const workflowJobs = await github.fetchWorkflowJobs(workflowRuns);

// TODO: runを日付でソートして、workflow_idごとに最新のrunだけを残してfetchするのもを最小限にする
// 日付だとブランチごとの最新を考慮できないが、それは実行時のオプションでブランチ指定などを追加してユーザーに任せる
const workflowFiles = await github.fetchWorkflowFiles(workflowRuns);
console.log(workflowFiles);
const workflowModels = workflowFiles
  .filter((it) => it !== undefined)
  .map((fileContent) => new WorkflowModel(fileContent!));

const runsSummary = createRunsSummary(
  workflowRuns,
  workflowRunUsages,
  workflowModels,
);
console.log("----runsSummary----");
console.dir(runsSummary, { depth: null });
console.log("----jobsSummary----");
const jobsSummary = createJobsSummary(
  runsSummary,
  workflowJobs,
  workflowModels,
);
console.dir(jobsSummary, { depth: null });

await reportWorkflowRetryRuns(runsSummary);
await reportWorkflowCount(runsSummary);
await reportWorkflowUsage(runsSummary);

const cacheUsage = await github.fetchActionsCacheUsage(owner, repo);
const cacheList = await github.fetchActionsCacheList(owner, repo, 5);
reportActiveCache(cacheUsage);
reportCacheList(cacheList);

checkSlowArtifactAction(jobsSummary);
checkCheckoutFilterBlobNone(jobsSummary);
checkTooShortBillableJob(jobsSummary);
