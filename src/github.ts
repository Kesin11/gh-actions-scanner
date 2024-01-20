import { Octokit, RestEndpointMethodTypes } from "npm:@octokit/rest@20.0.2";
import { minOf } from "https://deno.land/std@0.212.0/collections/min_of.ts";
import { maxOf } from "https://deno.land/std@0.212.0/collections/max_of.ts";

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
  usage: { // TODO: 特に適当すぎるので後で治す
    billable: {
      UBUNTU: {
        total_ms: number;
      };
    };
    run_duration_ms: number;
  };
}[];

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
    // per_page: 20, // gh run list もデフォルトでは20件表示
    per_page: 10, // debu
  });
  const runsSummary = res.data.workflow_runs.map((run) => {
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
      usage: {} as any, // 後から無理やり追加するので型は一旦anyで雑に対応
    };
  });

  // TODO: 雑に追加しすぎているので後で修正する
  // Add usage data
  for (const run of runsSummary) {
    const res = await octokit.actions.getWorkflowRunUsage({
      owner,
      repo,
      run_id: run.run_id,
    });
    run.usage = res.data;
  }

  return runsSummary;
}

export async function createJobsSummary(
  octokit: Octokit,
  runsSummary: RunsSummary,
) {
  const workflowJobs: WorkflowJobs[] = [];
  for (const run of runsSummary) {
    const res = await octokit.actions.listJobsForWorkflowRunAttempt({
      owner: run.owner,
      repo: run.repo,
      run_id: run.run_id,
      attempt_number: run.run_attemp,
    });
    workflowJobs.push(res.data.jobs);
  }

  const jobs = workflowJobs.flat()
    .filter((job) => job.conclusion === "success")
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
  const jobsSummary: Record<string, any> = {};
  for (const [workflowName, jobs] of Object.entries(jobsWorkflowGroup)) {
    const jobsJobGroup = Object.groupBy(jobs, (job) => job.name);
    for (const [jobName, jobs] of Object.entries(jobsJobGroup)) {
      jobsSummary[workflowName] = jobsSummary[workflowName] ?? {};
      jobsSummary[workflowName][jobName] = {
        minDurationSec: minOf(jobs, (job) => job.durationSec),
        maxDurationSec: maxOf(jobs, (job) => job.durationSec),
        medianDurationSec: 0,
        p90DurationSec: 0,
      };
    }
  }
  return jobsSummary;
}
