import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { Github } from "./packages/github/github.ts";
import {
  createJobsSummary,
  createRunsSummary,
} from "./src/workflow_summariser.ts";
import { reportCacheList } from "./src/rules/cache_list.ts";
import { reportActiveCache } from "./src/rules/cache_active_size.ts";
import { reportWorkflowUsage } from "./src/rules/workflow_run_usage.ts";
import { workflowCountStat } from "./src/rules/workflow_count_stat.ts";
import { reportWorkflowRetryRuns } from "./src/rules/workflow_retry_runs.ts";
import { WorkflowModel } from "./src/workflow_file.ts";
import { checkSlowArtifactAction } from "./src/rules/step_old_action_artifact.ts";
import { checkCheckoutFilterBlobNone } from "./src/rules/step_action_checkout_depth0.ts";
import { checkTooShortBillableJob } from "./src/rules/job_too_short_billable_runner.ts";
import { JsonFormatter, TableFormatter } from "./src/formatter/formatter.ts";

const { options, args } = await new Command()
  .name("actions-scanner")
  .description(
    "Scan GitHub Actions workflows and report performance issues.",
  )
  .option("-t, --token <token:string>", "GitHub token. ex: $(gh auth token)", {
    default: undefined,
  })
  .option(
    "-R, --repo <repo_fullname:string>",
    "Fullname of repository. OWNER/REPO format",
    { required: true },
  )
  // .option("-L, --limit <limit:integer>", "Maximum number of runs to fetch", {
  //   default: 20,
  // })
  .option(
    "-p, --perpage <per_lage:integer>",
    "Per page number of runs to fetch",
    {
      default: 20,
    },
  )
  .option(
    "--host <host:string>",
    "GitHub host. Specify your GHES host If you will use it on GHES",
    { default: "github.com" },
  )
  .parse(Deno.args);

const [owner, repo] = options.repo.split("/");
// const limit = options.limit;
const perPage = options.perpage;
const github = new Github();
console.log(`owner: ${owner}, repo: ${repo}, per_page: ${perPage}`);
const workflowRuns = (await github.fetchWorkflowRuns(owner, repo, perPage))
  .filter((run) => run.event !== "dynamic"); // Ignore some special runs that have not workflow file. ex: CodeQL
// console.dir(workflowRuns, { depth: null });
const workflowRunUsages = await github.fetchWorkflowRunUsages(workflowRuns);
const workflowJobs = await github.fetchWorkflowJobs(workflowRuns);

// TODO: runを日付でソートして、workflow_idごとに最新のrunだけを残してfetchするのもを最小限にする
// 日付だとブランチごとの最新を考慮できないが、それは実行時のオプションでブランチ指定などを追加してユーザーに任せる
const workflowFiles = await github.fetchWorkflowFiles(workflowRuns);
// console.log(workflowFiles);
const workflowModels = workflowFiles
  .filter((it) => it !== undefined)
  .map((fileContent) => new WorkflowModel(fileContent!));

const runsSummary = createRunsSummary(
  workflowRuns,
  workflowRunUsages,
  workflowModels,
);
console.log("----runsSummary----");
// console.dir(runsSummary, { depth: null });
console.log("----jobsSummary----");
const jobsSummary = createJobsSummary(
  runsSummary,
  workflowJobs,
  workflowModels,
);
// console.dir(jobsSummary, { depth: null });

const cacheUsage = await github.fetchActionsCacheUsage(owner, repo);
const cacheList = await github.fetchActionsCacheList(owner, repo, 5);

// Scan
const result = [];
result.push(await reportWorkflowRetryRuns(runsSummary));
result.push(await workflowCountStat(runsSummary));
result.push(await reportWorkflowUsage(runsSummary));

result.push(await reportActiveCache(cacheUsage));
result.push(await reportCacheList(cacheList));

result.push(await checkSlowArtifactAction(jobsSummary));
result.push(await checkCheckoutFilterBlobNone(jobsSummary));
result.push(await checkTooShortBillableJob(jobsSummary));

// Format
// const formatedResult = new JsonFormatter().format(result.flat());
const formatedResult = new TableFormatter().format(result.flat());

// Output
console.log(formatedResult);
