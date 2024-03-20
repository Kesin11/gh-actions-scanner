import type { RuleResult } from "./types.ts";
import type { RunsSummary } from "../workflow_summariser.ts";

const meta = {
  ruleId: "actions-scanner/workflow_count_stat",
  ruleUrl: undefined,
  fixable: false,
};

// deno-lint-ignore require-await
export async function workflowCountStat(
  runsSummary: RunsSummary,
): Promise<RuleResult> {
  console.log("----Workflow count----");
  const workflowCount: Record<string, number> = {};
  const runsByWorkflow = Object.groupBy(runsSummary, (run) => run.name);
  for (const workflowName of Object.keys(runsByWorkflow)) {
    const runs = runsByWorkflow[workflowName]!;
    workflowCount[workflowName] = runs.length;
    console.log(`${workflowName}: ${runs.length} runs`);
  }

  return {
    ...meta,
    severity: "info",
    messages: Object.entries(workflowCount).map(([workflowName, count]) =>
      `${workflowName}: ${count} runs`
    ),
    data: workflowCount,
  };
}
