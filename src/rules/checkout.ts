import { distinctBy } from "https://deno.land/std@0.218.2/collections/distinct_by.ts";
import { JobsSummary } from "../workflow_summariser.ts";

const THRESHOLD_DURATION_SEC = 30;

// stepsSummary.durationStatSecsが一定以上 && actions/checkoutを使っていてdepth:0の場合はfilter:blob:noneを推奨する
export function checkCheckoutFilterBlobNone(jobsSummary: JobsSummary) {
  console.log("----checkCheckoutFilterBlobNone----");
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

  // filter: blob:noneを提案
  const reportedSteps = distinctBy(targetSteps, (step) => step.stepModel?.raw)
    .map((step) => {
      console.warn(
        `actions/checkout with 'fetch-depth: 0' is slow. Recommend to use 'with.filter: blob:none'`,
        step.stepModel?.raw,
      );
      return step;
    });

  return reportedSteps;
}
