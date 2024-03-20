import type { RuleResult } from "./types.ts";
import type { JobsSummary } from "../workflow_summariser.ts";

const meta = {
  ruleId: "actions-scanner/job_too_short_billable_runner",
  ruleUrl: undefined,
  fixable: true,
};

// GitHub Actions charges per minutes.
// https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions
const THRESHOLD_DURATION_SEC = 60;

// Larger runners are not include free minutes.
function isLargerRunner(runner: string) {
  return runner !== "UBUNTU" && runner !== "WINDOWS" && runner !== "MACOS";
}

// 課金対象のジョブが中央値で1min未満の場合はジョブの合併を提案する
// deno-lint-ignore require-await
export async function checkTooShortBillableJob(
  jobsSummary: JobsSummary,
): Promise<RuleResult[]> {
  console.log("----checkTooShortBillableJob----");

  const reportedJobs = Object.values(jobsSummary).flatMap((jobs) => {
    return Object.values(jobs).flatMap((job) => {
      Object.entries(job.billableStatSecs).filter(
        ([runner, stat]) => {
          return (stat.median && stat.median < THRESHOLD_DURATION_SEC) &&
            isLargerRunner(runner);
        },
      ).forEach(([runner, stat]) => {
        console.warn(
          `Job "${job.jobModel?.id}" median duration ${stat.median}s with runner "${runner}" is shorter than minimum charge unit(60s). Recommend to composite to other jobs.`,
          `workflow: "${job.workflowModel?.name}", job: "${job.jobModel?.id}"`,
        );
      });
      return job; // NOTE: この返り値は使われていないので適当に返している
    });
  });

  return reportedJobs.map((job) => {
    return {
      ...meta,
      severity: "warn",
      messages: [
        `Job "${job.jobModel?.id}" median duration is ${job.billableStatSecs.median}sec. It shorter than minimum charge unit(${THRESHOLD_DURATION_SEC}sec)`,
      ],
      helpMessage:
        `Recommend to merge with other jobs: workflow: "${job.workflowModel?.name}", job: "${job.jobModel?.id}"`,
      data: job,
    };
  });
}
