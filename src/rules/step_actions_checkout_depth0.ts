import type { RuleResult } from "./types.ts";
import { distinctBy } from "https://deno.land/std@0.218.2/collections/distinct_by.ts";
import type { JobsSummary } from "../workflow_summariser.ts";
import { stringify } from "https://deno.land/std@0.212.0/yaml/stringify.ts";

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
  const checkoutSteps = [];
  for (const job of jobsSummary) {
    for (const step of job.stepsSummary) {
      if (step.stepModel?.uses?.action === "actions/checkout") {
        checkoutSteps.push(step);
      }
    }
  }

  // その中でdurationStatSecs.p90がTHRESHOLD_DURATION_SEC以上 && uses.with.depth === "0"のものを抽出
  const targetSteps = checkoutSteps.filter((step) => {
    return (step.durationStatSecs.p90 &&
      step.durationStatSecs.p90 > THRESHOLD_DURATION_SEC);
  }).filter((step) => Number(step.stepModel?.raw.with?.["fetch-depth"]) === 0);

  const reportedSteps = distinctBy(targetSteps, (step) => step.stepModel?.raw);

  return reportedSteps.map((step) => {
    return {
      ...meta,
      description: "actions/checkout with 'fetch-depth: 0' is slow",
      severity: "high",
      messages: [
        `actions/checkout with 'fetch-depth: 0' is slow. It takes p90 ${step.durationStatSecs.p90} sec`,
      ],
      helpMessage: `Recommend to use 'with.filter: blob:none'`,
      code: (step.stepModel?.raw) ? stringify(step.stepModel?.raw) : undefined,
      // TODO: こういうURLを表示させたい
      // "https://github.com/kesin11-private/gh-actions-scanner/blob/45e430b56e6731eeb9ae9369de72802e9802bef9/.github/workflows/ci.yaml#L23-L25",
      codeUrl: undefined,
      data: reportedSteps,
    };
  });
}
