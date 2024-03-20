import { sumOf } from "https://deno.land/std@0.212.0/collections/sum_of.ts";
import type { RuleResult } from "./types.ts";
import type { RunsSummary } from "../workflow_summariser.ts";

const meta = {
  ruleId: "actions-scanner/workflow_run_usage",
  ruleUrl: undefined,
  fixable: false,
};

// deno-lint-ignore require-await
export async function reportWorkflowUsage(
  runsSummary: RunsSummary,
): Promise<RuleResult[]> {
  const workflowUsage: Record<string, number> = {};
  const runsByWorkflow = Object.groupBy(runsSummary, (run) => run.name);
  for (const workflowName of Object.keys(runsByWorkflow)) {
    const runs = runsByWorkflow[workflowName]!;
    const sumRunDurationMs = sumOf(
      runs,
      (run) => run.usage?.run_duration_ms ?? 0,
    );
    workflowUsage[workflowName] = sumRunDurationMs / 1000;
  }

  return [{
    ...meta,
    severity: "info",
    messages: Object.entries(workflowUsage).map(([workflowName, duration]) =>
      `${workflowName}: ${duration} sec`
    ),
    data: workflowUsage,
  }];
}
