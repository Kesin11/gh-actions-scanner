import { max, median, min, quantile } from "npm:simple-statistics@7.8.3";
import {
  JobModel,
  StepModel,
  WorkflowModel,
} from "../packages/workflow_model/workflow_file.ts";
import {
  WorkflowJobs,
  WorkflowRun,
  WorkflowRunUsage,
} from "../packages/github/github.ts";

type DurationStat = {
  min: number | undefined;
  median: number | undefined;
  p80: number | undefined;
  p90: number | undefined;
  max: number | undefined;
};

export type RunSummary = {
  name: string;
  display_title: string;
  conslusion: string | null;
  run_attemp: number;
  run_id: number;
  workflow_id: number;
  run_started_at: string | undefined;
  owner: string;
  repo: string;
  usage: WorkflowRunUsage | undefined;
  workflowModel: WorkflowModel;
};

export type StepSummary = {
  name: string;
  count: number;
  successCount: number;
  durationStatSecs: DurationStat;
  stepModel: StepModel | undefined;
};

function diffSec(
  start?: string | Date | null,
  end?: string | Date | null,
): number {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);

  return (endDate.getTime() - startDate.getTime()) / 1000;
}

export function createRunSummaries(
  workflowRuns: WorkflowRun[],
  workflowRunUsages: WorkflowRunUsage[] | undefined,
  workflowModels: WorkflowModel[],
): RunSummary[] {
  if (workflowRunUsages && workflowRuns.length !== workflowRunUsages.length) {
    throw new Error("workflowRuns.length !== workflowUsages.length");
  }
  if (workflowRuns.length !== workflowModels.length) {
    throw new Error("workflowRuns.length !== workflowModels.length");
  }

  const runsSummary: RunSummary[] = workflowRuns.map((run, i) => {
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
      usage: workflowRunUsages?.at(i),
      workflowModel: workflowModels[i],
    };
  });

  return runsSummary;
}
type RunnerType = string;
export type JobSummary = {
  workflowName: string;
  jobNameOrId: string;
  count: number;
  successCount: number;
  durationStatSecs: DurationStat;
  billableStatSecs: Record<RunnerType, DurationStat>;
  stepSummaries: StepSummary[];
  workflowModel: WorkflowModel | undefined;
  jobModel: JobModel | undefined;
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

export function createJobSummaries(
  runSummaries: RunSummary[],
  workflowJobs: WorkflowJobs,
  workflowModels: WorkflowModel[],
): JobSummary[] {
  const jobsBillableSummary = createJobsBillableById(
    runSummaries.map((run) => run.usage),
  );

  // TODO: 関数にまとめるかクラス化するか後で考える
  const jobs = workflowJobs
    .map((workflowJob) => {
      return {
        ...workflowJob,
        jobRunId: workflowJob.id, // Alias. このidは実行ごとのユニークなid
        durationSec: diffSec(workflowJob.started_at, workflowJob.completed_at),
      };
    });
  const jobsWorkflowGroup = Object.groupBy(
    jobs,
    // NOTE: workflowのYAMLでname指定無しの場合、WorkflowModel.nameと同じ挙動かどうかは要確認
    (job) => job.workflow_name ?? "",
  );
  const workflowModelMap = WorkflowModel.createWorkflowNameMap(workflowModels);

  const jobSummaries: JobSummary[] = [];
  for (const [workflowName, jobs] of Object.entries(jobsWorkflowGroup)) {
    if (jobs === undefined) throw new Error("jobs is undefined");

    const jobsJobGroup = Object.groupBy(jobs, (job) => job.name); // YAMLにnameがあればname, なければキー名がnameとして扱われている
    const workflowJobModels = workflowModelMap.get(workflowName)?.jobs;

    for (const [jobNameOrId, jobs] of Object.entries(jobsJobGroup)) {
      if (jobs === undefined) throw new Error("jobs is undefined");

      const successJobs = jobs.filter((job) => job.conclusion === "success");
      const durationSecs = successJobs.map((job) => job.durationSec);
      const jobModel = JobModel.match(workflowJobModels, jobNameOrId);

      jobSummaries.push({
        workflowName,
        jobNameOrId,
        count: jobs.length,
        successCount: successJobs.length,
        durationStatSecs: createDurationStat(durationSecs),
        billableStatSecs: createJobsBillableStat(
          jobsBillableSummary,
          jobs.map((job) => job.id),
        ),
        stepSummaries: createStepSummaries(jobs, jobModel),
        workflowModel: workflowModelMap.get(workflowName),
        jobModel,
      });
    }
  }
  return jobSummaries;
}
function createStepSummaries(
  workflowJobs: WorkflowJobs,
  jobModel?: JobModel,
): StepSummary[] {
  const steps = workflowJobs.map((job) => job.steps ?? []).flat();
  const stepsGroup = Object.groupBy(steps, (step) => step.name);
  const stepModels = jobModel?.steps;

  const stepSummaries: StepSummary[] = [];
  for (const [stepName, steps] of Object.entries(stepsGroup)) {
    if (steps === undefined) throw new Error("steps is undefined");

    const successSteps = steps.filter((step) => step.conclusion === "success");
    const durationSecs = successSteps.map((step) =>
      diffSec(step.started_at, step.completed_at)
    );
    stepSummaries.push({
      // TODO:  後でソートするためにnumberを入れたいが、順序が変わっている可能性もあるのでmaxを入れておく
      name: stepName,
      count: steps.length,
      successCount: successSteps.length,
      durationStatSecs: createDurationStat(durationSecs),
      stepModel: StepModel.match(stepModels, stepName),
    });
  }
  return stepSummaries;
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
  workflowRunUsages: Array<WorkflowRunUsage | undefined>,
): JobsBillableById {
  const jobsBillableSummary: Record<
    string,
    { runner: string; duration_ms: number }
  > = {};
  for (const workflowRunUsage of workflowRunUsages) {
    if (workflowRunUsage === undefined) continue;

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
// "UBUNTU": {
//   min: 10
//   median: 30
//   p80: 50
//   p90: 60
//   max: 60
// },
//   "WINDOWS": { ... },
// }
export type JobsBillableStat = Record<
  string,
  DurationStat
>;
export function createJobsBillableStat(
  jobsBillableById: JobsBillableById,
  jobIds: number[],
): JobsBillableStat {
  const jobsBillable = jobIds.map((jobId) => jobsBillableById[jobId])
    .filter((jobBillable) => jobBillable !== undefined);
  const jobsBIllableGroup = Object.groupBy(
    jobsBillable,
    (billable) => billable.runner,
  );
  const summary: JobsBillableStat = {};
  for (const runner of Object.keys(jobsBIllableGroup)) {
    const durationSecs = jobsBIllableGroup[runner]!.map((billable) =>
      billable.duration_ms / 1000
    );
    summary[runner] = createDurationStat(durationSecs);
  }
  return summary;
}
