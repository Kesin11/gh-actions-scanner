import { type FileContent, Github } from "./packages/github/github.ts";
import { fromPromise } from "npm:neverthrow@6.2.2";
import type { Err, Ok } from "npm:neverthrow@6.2.2";
import {
  createJobSummaries,
  createRunSummaries,
} from "./src/workflow_summariser.ts";
import { WorkflowModel } from "./packages/workflow_model/src/workflow_file.ts";
import { Formatter, type FormatterType } from "./src/formatter/formatter.ts";
import type { RuleArgs, RuleResult } from "./src/rules/types.ts";
import { filterSeverity, sortRules } from "./src/rules_translator.ts";
import { loadConfig } from "./src/config.ts";
import { RuleExecutionError } from "./src/errors.ts";
import { argParse } from "./src/arg_parser.ts";
import { generateCreatedDate } from "./src/github_util.ts";

const options = await argParse();
const config = await loadConfig(options.config);
if (config.isErr()) {
  console.error(config.error);
  Deno.exit(1);
}

const [owner, repo] = options.repo.split("/");
const github = new Github({
  debug: options.debug,
  token: options.token,
  host: options.host,
});

const created = options.created !== undefined
  ? options.created
  : await (async () => {
    const workflowRuns = await github.fetchWorkflowRuns(owner, repo);
    return generateCreatedDate(workflowRuns);
  })();

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
