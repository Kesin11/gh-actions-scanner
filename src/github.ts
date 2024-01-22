import { Octokit, RestEndpointMethodTypes } from "npm:@octokit/rest@20.0.2";
import { max, median, min, quantile } from "npm:simple-statistics@7.8.3";

export type WorkflowRun =
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

export type ActionsCacheUsage =
  RestEndpointMethodTypes["actions"]["getActionsCacheUsage"]["response"][
    "data"
  ];
export type ActionsCacheList =
  RestEndpointMethodTypes["actions"]["getActionsCacheList"]["response"]["data"];

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
  successCount: number;
  durationStatSecs: {
    min: number | undefined;
    median: number | undefined;
    p80: number | undefined;
    p90: number | undefined;
    max: number | undefined;
  };
}>;

export class Github {
  octokit: Octokit;

  constructor() {
    const token = Deno.env.get("GITHUB_TOKEN");
    const baseUrl = Deno.env.get("GITHUB_API_URL") ?? "https://api.github.com";
    this.octokit = new Octokit({
      auth: token,
      baseUrl,
    });
  }

  async fetchWorkflowRunUsages(
    workflowRuns: WorkflowRun[],
  ): Promise<WorkflowRunUsage[]> {
    const promises = workflowRuns.map((run) => {
      return this.octokit.actions.getWorkflowRunUsage({
        owner: run.repository.owner.login,
        repo: run.repository.name,
        run_id: run.id,
      });
    });
    return (await Promise.all(promises)).map((res) => res.data);
  }

  async fetchWorkflowJobs(
    workflowRuns: WorkflowRun[],
  ): Promise<WorkflowJobs> {
    const promises = workflowRuns.map((run) => {
      return this.octokit.actions.listJobsForWorkflowRunAttempt({
        owner: run.repository.owner.login,
        repo: run.repository.name,
        run_id: run.id,
        attempt_number: run.run_attempt ?? 1,
      });
    });
    const workflowJobs = (await Promise.all(promises)).map((res) =>
      res.data.jobs
    );
    return workflowJobs.flat();
  }

  async fetchWorkflowRuns(
    owner: string,
    repo: string,
    perPage: number,
  ): Promise<WorkflowRun[]> {
    const res = await this.octokit.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      per_page: perPage,
    });
    return res.data.workflow_runs;
  }

  async fetchActionsCacheUsage(
    owner: string,
    repo: string,
  ): Promise<ActionsCacheUsage> {
    const res = await this.octokit.actions.getActionsCacheUsage({
      owner,
      repo,
    });
    return res.data;
  }

  async fetchActionsCacheList(
    owner: string,
    repo: string,
    perPage: number,
  ): Promise<ActionsCacheList> {
    const res = await this.octokit.actions.getActionsCacheList({
      owner,
      repo,
      sort: "size_in_bytes",
      per_page: perPage,
    });
    return res.data;
  }
}

export function createRunsSummary(
  workflowRuns: WorkflowRun[],
  workflowRunUsages: WorkflowRunUsage[],
): RunsSummary {
  const runsSummary: RunsSummary = workflowRuns.map((run) => {
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

  if (runsSummary.length !== workflowRunUsages.length) {
    throw new Error("runsSummary.length !== workflowUsages.length");
  }
  for (let i = 0; i < runsSummary.length; i++) {
    runsSummary[i].usage = workflowRunUsages[i];
  }

  return runsSummary;
}

type RunnerType = string;
type JobsSummary = Record<
  string,
  Record<string, {
    count: number;
    successCount: number;
    durationStatSecs: {
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

type DurationStat = {
  min: number | undefined;
  median: number | undefined;
  p80: number | undefined;
  p90: number | undefined;
  max: number | undefined;
};
function createDurationStat(durations: number[]): DurationStat {
  const isEmpty = durations.length === 0;
  return {
    min: isEmpty ? undefined : min(durations),
    median: isEmpty ? undefined : median(durations),
    p80: isEmpty ? undefined : quantile(durations, 0.8),
    p90: isEmpty ? undefined : quantile(durations, 0.9),
    max: isEmpty ? undefined : max(durations),
  };
}

export function createJobsSummary(
  runsSummary: RunsSummary,
  workflowJobs: WorkflowJobs,
) {
  const jobsBillableSummary = createJobsBillableById(
    runsSummary.map((run) => run.usage),
  );

  const jobs = workflowJobs
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
      const durationSecs = successJobs.map((job) => job.durationSec);

      jobsSummary[workflowName] = jobsSummary[workflowName] ?? {};
      jobsSummary[workflowName][jobName] = {
        count: jobs.length,
        successCount: successJobs.length,
        durationStatSecs: createDurationStat(durationSecs),
        billable: createJobsBillableSummary(
          jobsBillableSummary,
          jobs.map((job) => job.id),
        ),
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
    const durationSecs = successSteps.map((step) =>
      diffSec(step.started_at, step.completed_at)
    );
    stepsSummary[stepName] = {
      count: steps.length,
      successCount: successSteps.length,
      durationStatSecs: createDurationStat(durationSecs),
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
//   "runner": "ubuntu_16_core",
//   "duration_ms": 0,
//  }
// }
export type JobsBillableById = Record<string, {
  runner: string;
  duration_ms: number;
}>;
export function createJobsBillableById(
  workflowRunUsages: WorkflowRunUsage[],
): JobsBillableById {
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

// Example
// {
//   "UBUNTU": { sumDurationMs: 100 },
//   "WINDOWS": { sumDurationMs: 100 },
// }
export type JobsBillableSummary = Record<
  string,
  { sumDurationMs: number }
>;
export function createJobsBillableSummary(
  jobsBillableById: JobsBillableById,
  jobIds: number[],
): JobsBillableSummary {
  const jobsBillable = jobIds.map((jobId) => jobsBillableById[jobId])
    .filter((jobBillable) => jobBillable !== undefined);
  const jobsBillableSum: Record<string, { sumDurationMs: number }> = {};
  for (const billable of jobsBillable) {
    jobsBillableSum[billable.runner] = jobsBillableSum[billable.runner] ??
      { sumDurationMs: 0 };
    jobsBillableSum[billable.runner].sumDurationMs += billable.duration_ms;
  }
  return jobsBillableSum;
}
