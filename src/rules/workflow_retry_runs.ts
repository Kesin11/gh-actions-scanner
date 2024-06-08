import type { RuleArgs, RuleResult } from "./types.ts";

const meta = {
  ruleId: "actions-scanner/workflow_retry_runs",
  ruleUrl: undefined,
  fixable: false,
};

// deno-lint-ignore require-await
export async function reportWorkflowRetryRuns(
  { runSummaries }: RuleArgs,
): Promise<RuleResult[]> {
  const retriedRuns = runSummaries.filter((run) =>
    run.run_attemp && run.run_attemp > 1
  );

  if (retriedRuns.length === 0) return [];

  const allGroup = Object.groupBy(runSummaries, (run) => run.name);
  const retriedGroup = Object.groupBy(retriedRuns, (run) => run.name);

  return [{
    ...meta,
    description: "Count of each retried workflow runs",
    severity: "low",
    messages: Object.entries(retriedGroup).map(([name, runs]) => {
      return `${name}: ${runs!.length}/${
        allGroup[name]!.length
      } runs are retried.`;
    }),
    data: retriedRuns.map((run) => {
      return {
        workflow_name: run.name,
        attempt: run.run_attemp,
        run_id: run.run_id,
        // TODO: runのurlも出したい
      };
    }),
  }];
}
