import { Octokit, RestEndpointMethodTypes } from "npm:@octokit/rest@20.0.2";
import { max, median, min, quantile } from "npm:simple-statistics@7.8.3";

export type Workflow =
  RestEndpointMethodTypes["actions"]["getWorkflowRunAttempt"]["response"][
    "data"
  ];
export type WorkflowJobs =
  RestEndpointMethodTypes["actions"]["listJobsForWorkflowRunAttempt"][
    "response"
  ][
    "data"
  ]["jobs"];

export type WorkflowRunUsage =
  RestEndpointMethodTypes["actions"]["getWorkflowRunUsage"]["response"]["data"];

function diffSec(
  start?: string | Date | null,
  end?: string | Date | null,
): number {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);

  return (endDate.getTime() - startDate.getTime()) / 1000;
}

export type RunsSummary = {
  // 後でoctokitの型から持ってくる
  name: string;
  display_title: string;
  conslusion: string | null;
  run_attemp: number;
  run_id: number;
  workflow_id: number;
  run_started_at: string | undefined;
  owner: string;
  repo: string;
  usage: WorkflowRunUsage;
}[];

type StepsSummary = Record<string, {
  count: number;
  durationSecs: {
    min: number | undefined;
    median: number | undefined;
    p80: number | undefined;
    p90: number | undefined;
    max: number | undefined;
  };
}>;

export function createOctokit(): Octokit {
  const token = Deno.env.get("GITHUB_TOKEN");
  const baseUrl = Deno.env.get("GITHUB_API_URL") ?? "https://api.github.com";
  return new Octokit({
    auth: token,
    baseUrl,
  });
}

export async function createRunsSummary(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<RunsSummary> {
  const res = await octokit.actions.listWorkflowRunsForRepo({
    owner,
    repo,
    per_page: 20, // gh run list もデフォルトでは20件表示
  });
  const runsSummary: RunsSummary = res.data.workflow_runs.map((run) => {
    return {
      name: run.name!,
      owner: run.repository.owner.login,
      repo: run.repository.name,
      display_title: run.display_title,
      conslusion: run.conclusion,
      run_attemp: run.run_attempt ?? 1,
      run_id: run.id,
      workflow_id: run.workflow_id,
      run_started_at: run.run_started_at,
      usage: undefined as unknown as WorkflowRunUsage,
    };
  });

  // Add usage data to each run
  // Example:
  // usage: {
  //   billable: {
  //     UBUNTU: {
  //       total_ms: 0,
  //       jobs: 4,
  //       job_runs: [
  //         { job_id: 20474751294, duration_ms: 0 },
  //         { job_id: 20474751396, duration_ms: 0 },
  //         { job_id: 20474751516, duration_ms: 0 },
  //         { job_id: 20474762355, duration_ms: 0 }
  //       ]
  //     }
  //   },
  //   run_duration_ms: 48000
  // }
  const promises = runsSummary.map((run) => {
    return octokit.actions.getWorkflowRunUsage({
      owner: run.owner,
      repo: run.repo,
      run_id: run.run_id,
    });
  });
  const workflowRunUsages = await Promise.all(promises);
  if (runsSummary.length !== workflowRunUsages.length) {
    throw new Error("runsSummary.length !== workflowUsages.length");
  }
  for (let i = 0; i < runsSummary.length; i++) {
    runsSummary[i].usage = workflowRunUsages[i].data;
  }

  return runsSummary;
}

type RunnerType = string;
type JobsSummary = Record<
  string,
  Record<string, {
    count: number;
    durationSecs: {
      min: number | undefined;
      median: number | undefined;
      p80: number | undefined;
      p90: number | undefined;
      max: number | undefined;
    };
    stepsSummary: StepsSummary;
    billable: Record<RunnerType, { sumDurationMs: number }>;
  }>
>;
export async function createJobsSummary(
  octokit: Octokit,
  runsSummary: RunsSummary,
) {
  const jobsBillableSummary = createJobsBillableSummary(
    runsSummary.map((run) => run.usage),
  );

  const promises = runsSummary.map((run) => {
    return octokit.actions.listJobsForWorkflowRunAttempt({
      owner: run.owner,
      repo: run.repo,
      run_id: run.run_id,
      attempt_number: run.run_attemp,
    });
  });
  const workflowJobs = (await Promise.all(promises)).map((res) =>
    res.data.jobs
  );
  const jobs = workflowJobs.flat()
    .map((workflowJob) => {
      return {
        ...workflowJob,
        durationSec: diffSec(workflowJob.started_at, workflowJob.completed_at),
      };
    });
  const jobsWorkflowGroup = Object.groupBy(
    jobs,
    (job) => job.workflow_name ?? "",
  );

  const jobsSummary: JobsSummary = {};
  for (const [workflowName, jobs] of Object.entries(jobsWorkflowGroup)) {
    const jobsJobGroup = Object.groupBy(jobs, (job) => job.name);
    for (const [jobName, jobs] of Object.entries(jobsJobGroup)) {
      const successJobs = jobs.filter((job) => job.conclusion === "success");
      const isJobsEmpty = successJobs.length === 0;
      const durationSecs = successJobs.map((job) => job.durationSec);

      // TODO: functions化する
      const jobsBillable = jobs.map((job) => jobsBillableSummary[job.id])
        .filter((job) => job !== undefined);
      const jobsBillableSum: Record<string, { sumDurationMs: number }> = {};
      for (const billable of jobsBillable) {
        jobsBillableSum[billable.runner] = jobsBillableSum[billable.runner] ??
          { sumDurationMs: 0 };
        jobsBillableSum[billable.runner].sumDurationMs += billable.duration_ms;
      }

      jobsSummary[workflowName] = jobsSummary[workflowName] ?? {};
      jobsSummary[workflowName][jobName] = {
        count: jobs.length,
        durationSecs: {
          min: isJobsEmpty ? undefined : min(durationSecs),
          median: isJobsEmpty ? undefined : median(durationSecs),
          p80: isJobsEmpty ? undefined : quantile(durationSecs, 0.8),
          p90: isJobsEmpty ? undefined : quantile(durationSecs, 0.9),
          max: isJobsEmpty ? undefined : max(durationSecs),
        },
        billable: jobsBillableSum,
        stepsSummary: createStepsSummary(jobs),
      };
    }
  }
  return jobsSummary;
}

function createStepsSummary(workflowJobs: WorkflowJobs): StepsSummary {
  const steps = workflowJobs.map((job) => job.steps ?? []).flat();
  const stepsGroup = Object.groupBy(steps, (step) => step.name);
  const stepsSummary: StepsSummary = {};
  for (const [stepName, steps] of Object.entries(stepsGroup)) {
    const successSteps = steps.filter((step) => step.conclusion === "success");
    const isStepsEmpty = successSteps.length === 0;
    const stepDurationsSecs = successSteps.map((step) =>
      diffSec(step.started_at, step.completed_at)
    );
    stepsSummary[stepName] = {
      count: steps.length,
      durationSecs: {
        min: isStepsEmpty ? undefined : min(stepDurationsSecs),
        median: isStepsEmpty ? undefined : median(stepDurationsSecs),
        p80: isStepsEmpty ? undefined : quantile(stepDurationsSecs, 0.8),
        p90: isStepsEmpty ? undefined : quantile(stepDurationsSecs, 0.9),
        max: isStepsEmpty ? undefined : max(stepDurationsSecs),
      },
    };
  }
  return stepsSummary;
}

// Example:
// {
//  "20474751294": { // job_id
//   "runner": "UBUNTU",
//   "duration_ms": 0,
//  },
//  "20474751396": {
//   "runner": "UBUNTU-16",
//   "duration_ms": 0,
//  }
// }
type JobsBillableSummary = Record<string, {
  runner: string;
  duration_ms: number;
}>;
function createJobsBillableSummary(
  workflowRunUsages: WorkflowRunUsage[],
): JobsBillableSummary {
  const jobsBillableSummary: Record<
    string,
    { runner: string; duration_ms: number }
  > = {};
  for (const workflowRunUsage of workflowRunUsages) {
    for (
      const [runner, billable] of Object.entries(workflowRunUsage.billable)
    ) {
      for (const jobsRuns of billable.job_runs ?? []) {
        jobsBillableSummary[jobsRuns.job_id] = {
          runner,
          duration_ms: jobsRuns.duration_ms,
        };
      }
    }
  }
  return jobsBillableSummary;
}
