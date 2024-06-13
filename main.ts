import {
  Command,
  EnumType,
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { type FileContent, Github } from "./packages/github/github.ts";
import { type Err, fromPromise, type Ok } from "npm:neverthrow@6.2.2";
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
import type { RuleArgs, RuleResult } from "./src/rules/types.ts";
import { loadConfig } from "./src/config.ts";
import { RuleExecutionError } from "./src/errors.ts";

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
  .option(
    "--created <created:string>",
    "Returns workflow runs created within the given date-time range. ex: >=YYYY-MM-DD, YYYY-MM-DD..YYYY-MM-DD. Default is <${YESTERDAY}. For more information on the syntax, see https://docs.github.com/search-github/getting-started-with-searching-on-github/understanding-the-search-syntax#query-for-dates",
    {
      default: undefined,
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
  .option(
    "--debug [debug:boolean]",
    "Enable debug log. Default: false",
    { default: false },
  )
  .parse(Deno.args);

const config = await loadConfig(options.config);
if (config.isErr()) {
  console.error(config.error);
  Deno.exit(1);
}

const [owner, repo] = options.repo.split("/");
const github = new Github({ debug: options.debug });
const created = options.created ??
  `>=${new Date().toISOString().split("T")[0]}`; // Default is yesterday of <YYYY-MM-DD format.

console.debug(`owner: ${owner}, repo: ${repo}, created: ${created}`);
const workflowRuns = await github.fetchWorkflowRunsWithCreated(
  owner,
  repo,
  created,
);
if (workflowRuns.length === 0) {
  console.error(
    "No workflow runs found. Try expanding the range of dates in the --created option.",
  );
  Deno.exit(1);
}

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
  console.error(
    "No workflow files found. Maybe --workflow_file_ref is invalid ref.",
  );
  Deno.exit(1);
}

const workflowModels = workflowFiles
  .filter((it): it is FileContent => it !== undefined)
  .map((fileContent) => new WorkflowModel(fileContent));

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

const okResults: Ok<RuleResult[], RuleExecutionError>[] = [];
const errResults: Err<RuleResult[], RuleExecutionError>[] = [];
for (const ruleFunc of config.value.rules) {
  const result = await fromPromise(
    ruleFunc(ruleArgs),
    (e) =>
      new RuleExecutionError(`${ruleFunc.name} rule throws an error.`, {
        cause: e,
      }),
  );
  if (result.isOk()) {
    okResults.push(result);
  } else {
    errResults.push(result);
  }
}

// Translate
const ruleResults = okResults
  .map((okResult) => okResult.value)
  .map((results) => filterSeverity(results, options.severity))
  .map((results) => sortRules(results))
  .flat();

// Format
const formatter = new Formatter(options.format as FormatterType);
const formatedResult = formatter.format(ruleResults);

// Output
console.log(formatedResult);

// Output error rules
if (errResults.length > 0) {
  console.warn("Some rules throw error. These are skipped.");
  for (const errResult of errResults) {
    console.error(errResult.error);
  }
}
