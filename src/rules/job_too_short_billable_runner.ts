import type { RuleArgs, RuleResult } from "./types.ts";

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
  { jobSummaries }: RuleArgs,
): Promise<RuleResult[]> {
  const reportedJobs = [];
  for (const job of jobSummaries) {
    for (const [runner, stat] of Object.entries(job.billableStatSecs)) {
      if (
        stat.median && stat.median < THRESHOLD_DURATION_SEC &&
        isLargerRunner(runner)
      ) {
        reportedJobs.push({ job, runner });
      }
    }
  }

  return reportedJobs.map(({ job, runner }) => {
    return {
      ...meta,
      description: "Job time shorter than minimum charge unit 60sec",
      severity: "medium",
      messages: [
        `workflow: "${job.workflowModel?.name}", job "${job.jobModel?.id}" median duration is ${
          job.billableStatSecs[runner].median
        }sec.`,
      ],
      helpMessage:
        `Recommend to merge with other jobs or using standard runner: workflow: "${job.workflowModel?.name}", job: "${job.jobModel?.id}", runner: ${runner}`,
      codeUrl: job.jobModel?.htmlUrlWithLine,
      data: {
        workflow: job.workflowModel?.name,
        job: job.jobModel?.id,
        runner,
        billableStatSecs: job.billableStatSecs[runner],
      },
    };
  });
}
