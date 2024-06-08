import type { RuleArgs, RuleResult } from "./types.ts";

const meta = {
  ruleId: "actions-scanner/workflow_count_stat",
  ruleUrl: undefined,
  fixable: false,
};

// deno-lint-ignore require-await
export async function workflowCountStat(
  { runSummaries }: RuleArgs,
): Promise<RuleResult[]> {
  const workflowCount: Record<string, number> = {};
  const runsByWorkflow = Object.groupBy(runSummaries, (run) => run.name);
  for (const workflowName of Object.keys(runsByWorkflow)) {
    const runs = runsByWorkflow[workflowName]!;
    workflowCount[workflowName] = runs.length;
  }

  const sortedCounts = Object.entries(workflowCount).sort((a, b) =>
    b[1] - a[1]
  );
  return [{
    ...meta,
    description: "Count of workflow runs",
    severity: "low",
    messages: sortedCounts.map(([workflowName, count]) =>
      `${workflowName}: ${count} runs`
    ),
    data: workflowCount,
  }];
}
