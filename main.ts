import {
  Command,
  EnumType,
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { Github } from "./packages/github/github.ts";
import {
  createJobSummaries,
  createRunSummaries,
} from "./src/workflow_summariser.ts";
import { WorkflowModel } from "./packages/workflow_model/src/workflow_file.ts";
import { Formatter, formatterList } from "./src/formatter/formatter.ts";
import type { FormatterType } from "./src/formatter/formatter.ts";
import { severityList } from "./src/rules/types.ts";
import { filterSeverity } from "./src/rules_translator.ts";
import { sortRules } from "./src/rules_translator.ts";
import type { RuleArgs } from "./src/rules/types.ts";
import { loadConfig } from "./src/config.ts";

const formatterType = new EnumType(formatterList);
const severityType = new EnumType(severityList);
const { options, args: _args } = await new Command()
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
  // TODO: packages/github.ts側でループしてfetchする機能実装後に有効化する
  // .option("-L, --limit <limit:integer>", "Maximum number of runs to fetch", {
  //   default: 20,
  // })
  .option(
    "-p, --perpage <perpage:integer>",
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
  .option(
    "--config <config:string>",
    "config file path. Default: actions-scanner.config.ts . If actions-scanner.config.ts is not found, use included default config.",
    { default: undefined },
  )
  .type("format", formatterType)
  .option(
    "-f, --format <name:format>",
    `Formatter name. Default: "table". Available: ${formatterType.values()}`,
    {
      default: "table",
    },
  )
  .type("severity", severityType)
  .option(
    "-s, --severity <items:severity[]>",
    `Severities of filter result. Pass to camma separated string. Available: ${severityType.values()}`,
    {
      separator: ",",
      default: severityType.values(),
    },
  )
  .option(
    "--workflow-file-ref <workflow_file_ref:string>",
    "Git ref for workflow files that will use showing url at result. Default: Repository main branch",
    { default: undefined },
  )
  .parse(Deno.args);

const config = await loadConfig(options.config);

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

// Fetch repo default branch if options.workflowFileRef is not set
const workflowFileRef = options.workflowFileRef ??
  (await github.fetchRepository(owner, repo)).default_branch;
const workflowFiles = await github.fetchWorkflowFilesByRef(
  workflowRuns,
  workflowFileRef,
);
if (workflowFiles.every((it) => it === undefined)) {
  throw new Error(
    "No workflow files found. Maybe --workflow_file_ref is invalid ref.",
  );
}
const workflowModels = workflowFiles
  .filter((it) => it !== undefined)
  .map((fileContent) => new WorkflowModel(fileContent!));

const runSummaries = createRunSummaries(
  workflowRuns,
  workflowRunUsages,
  workflowModels,
);
// console.dir(runSummaries, { depth: null });
const jobSummaries = createJobSummaries(
  runSummaries,
  workflowJobs,
  workflowModels,
);
// console.dir(jobSummaries, { depth: null });

const actionsCacheUsage = await github.fetchActionsCacheUsage(owner, repo);
const actionsCacheList = await github.fetchActionsCacheList(owner, repo, 5);

// Scan
const ruleArgs: RuleArgs = {
  runSummaries,
  jobSummaries,
  actionsCacheUsage,
  actionsCacheList,
  config: {},
};
let result = [];

for (const ruleFunc of config.rules) {
  result.push(await ruleFunc(ruleArgs));
}

// Translate
result = filterSeverity(result.flat(), options.severity);
result = sortRules(result);

// Format
const formatter = new Formatter(options.format as FormatterType);
const formatedResult = formatter.format(result);

// Output
console.log(formatedResult);
