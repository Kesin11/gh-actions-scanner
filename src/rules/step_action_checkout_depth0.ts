import type { RuleResult } from "./types.ts";
import { distinctBy } from "https://deno.land/std@0.218.2/collections/distinct_by.ts";
import type { JobsSummary } from "../workflow_summariser.ts";

const meta = {
  ruleId: "actions-scanner/step_action_checkout_depth0",
  ruleUrl: undefined,
  fixable: true,
};

const THRESHOLD_DURATION_SEC = 30;

// stepsSummary.durationStatSecsが一定以上 && actions/checkoutを使っていてdepth:0の場合はfilter:blob:noneを推奨する
// deno-lint-ignore require-await
export async function checkCheckoutFilterBlobNone(
  jobsSummary: JobsSummary,
): Promise<RuleResult[]> {
  // 全てのjobを捜査してactions/checkoutを使っているstepsSummaryを抽出
  const checkoutSteps = Object.values(jobsSummary).flatMap((jobs) => {
    return Object.values(jobs).flatMap((job) => {
      return Object.values(job.stepsSummary).filter((step) => {
        const action = step.stepModel?.uses?.action;
        return action === "actions/checkout";
      });
    });
  });

  // その中でdurationStatSecs.p90がTHRESHOLD_DURATION_SEC以上 && uses.with.depth === "0"のものを抽出
  const targetSteps = checkoutSteps.filter((step) => {
    return (step.durationStatSecs.p90 &&
      step.durationStatSecs.p90 > THRESHOLD_DURATION_SEC);
  }).filter((step) => Number(step.stepModel?.raw.with?.["fetch-depth"]) === 0);

  const reportedSteps = distinctBy(targetSteps, (step) => step.stepModel?.raw);

  return reportedSteps.map((step) => {
    return {
      ...meta,
      severity: "high",
      messages: [
        `actions/checkout with 'fetch-depth: 0' is slow. It takes p90 ${step.durationStatSecs.p90} sec`,
      ],
      helpMessage:
        `Recommend to use 'with.filter: blob:none': ${step.stepModel?.raw}`,
      data: reportedSteps,
    };
  });
}
