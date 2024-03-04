import { sumOf } from "https://deno.land/std@0.212.0/collections/sum_of.ts";
import { RunsSummary } from "../workflow_summariser.ts";

export function reportWorkflowRetryRuns(runsSummary: RunsSummary) {
  const retriedRuns = runsSummary.filter((run) =>
    run.run_attemp && run.run_attemp > 1
  );
  console.log("----Retry runs----");
  console.log(`${retriedRuns.length}/${runsSummary.length} runs are retried`);
  if (retriedRuns.length !== 0) {
    console.dir(retriedRuns.map((run) => {
      return {
        workflow_name: run.name,
        attempt: run.run_attemp,
        run_id: run.run_id,
      };
    }));
  }
}

export function reportWorkflowCount(runsSummary: RunsSummary) {
  console.log("----Workflow count----");
  const runsByWorkflow = Object.groupBy(runsSummary, (run) => run.name);
  for (const workflowName of Object.keys(runsByWorkflow)) {
    const runs = runsByWorkflow[workflowName]!;
    console.log(`${workflowName}: ${runs.length} runs`);
  }
}

export function reportWorkflowUsage(runsSummary: RunsSummary) {
  console.log("----Workflow sum of usage.run_duration ----");
  const runsByWorkflow = Object.groupBy(runsSummary, (run) => run.name);
  for (const workflowName of Object.keys(runsByWorkflow)) {
    const runs = runsByWorkflow[workflowName]!;
    const sumRunDurationMs = sumOf(
      runs,
      (run) => run.usage?.run_duration_ms ?? 0,
    );
    console.log(`${workflowName}: ${sumRunDurationMs / 1000}sec `);
  }
}
