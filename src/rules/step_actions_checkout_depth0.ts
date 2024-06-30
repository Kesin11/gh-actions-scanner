import type { RuleArgs, RuleResult } from "./types.ts";
import { distinctBy } from "https://deno.land/std@0.224.0/collections/distinct_by.ts";
import { stringify } from "https://deno.land/std@0.224.0/yaml/stringify.ts";

const meta = {
  ruleId: "actions-scanner/step_action_checkout_depth0",
  ruleUrl: undefined,
  fixable: true,
};

const THRESHOLD_DURATION_SEC = 30;

// stepSummaries.durationStatSecsが一定以上 && actions/checkoutを使っていてdepth:0の場合はfilter:blob:noneを推奨する
// deno-lint-ignore require-await
export async function checkCheckoutFilterBlobNone(
  { jobSummaries }: RuleArgs,
): Promise<RuleResult[]> {
  // 全てのjobを捜査してactions/checkoutを使っているstepSummariesを抽出
  const checkoutSteps = [];
  for (const job of jobSummaries) {
    for (const step of job.stepSummaries) {
      if (step.stepModel?.uses?.action === "actions/checkout") {
        checkoutSteps.push(step);
      }
    }
  }

  // その中でdurationStatSecs.p90がTHRESHOLD_DURATION_SEC以上 && uses.with.depth === "0"のものを抽出
  const targetSteps = checkoutSteps.filter((step) => {
    return (step.durationStatSecs.p90 &&
      step.durationStatSecs.p90 > THRESHOLD_DURATION_SEC);
  }).filter((step) => Number(step.stepModel?.raw.with?.["fetch-depth"]) === 0)
    // filterに"blob:none"などがセットされていればOK
    .filter((step) => step.stepModel?.raw.with?.["filter"] === undefined);

  const reportedSteps = distinctBy(targetSteps, (step) => step.stepModel?.raw);

  return reportedSteps.map((step) => {
    return {
      ...meta,
      description: "actions/checkout with 'fetch-depth: 0' is slow",
      severity: "high",
      messages: [
        `actions/checkout with 'fetch-depth: 0' is slow. It takes p90 ${step.durationStatSecs.p90} sec`,
      ],
      helpMessage:
        `Recommend to set depth >0 or using with 'filter' option. ex: 'filter: blob:none'`,
      code: (step.stepModel?.raw) ? stringify(step.stepModel?.raw) : undefined,
      codeUrl: step.stepModel?.htmlUrlWithLine,
      data: reportedSteps,
    };
  });
}
