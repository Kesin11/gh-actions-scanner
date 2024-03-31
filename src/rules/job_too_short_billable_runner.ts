import type { RuleResult } from "./types.ts";
import type { JobSummary } from "../workflow_summariser.ts";

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
  jobSummaries: JobSummary[],
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
      // TODO: こういうURLを表示させたい
      // "https://github.com/kesin11-private/gh-actions-scanner/blob/45e430b56e6731eeb9ae9369de72802e9802bef9/.github/workflows/ci.yaml#L23-L25",
      codeUrl: job.workflowModel?.htmlUrl,
      data: {
        workflow: job.workflowModel?.name,
        job: job.jobModel?.id,
        runner,
        billableStatSecs: job.billableStatSecs[runner],
      },
    };
  });
}
