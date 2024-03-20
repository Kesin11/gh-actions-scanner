import type { RuleResult } from "./types.ts";
import type { RunsSummary } from "../workflow_summariser.ts";

const meta = {
  ruleId: "actions-scanner/workflow_retry_runs",
  ruleUrl: undefined,
  fixable: false,
};

// deno-lint-ignore require-await
export async function reportWorkflowRetryRuns(
  runsSummary: RunsSummary,
): Promise<RuleResult[]> {
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

  return [{
    ...meta,
    severity: "info",
    // TODO: メッセージにも各ワークフローが何回リトライされたかを表示する
    messages: [
      `${retriedRuns.length}/${runsSummary.length} runs are retried`,
    ],
    data: retriedRuns.map((run) => {
      return {
        workflow_name: run.name,
        attempt: run.run_attemp,
        run_id: run.run_id,
      };
    }),
  }];
}
