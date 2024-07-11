import { runLengthDecode } from "https://deno.land/std@0.196.0/console/_rle.ts";
import type {
  Github,
  WorkflowJobs,
  WorkflowRun,
} from "../packages/github/github.ts";

// Generate a date range based on the oldest "created_at" value in workflowRuns
export function generateCreatedDate(workflowRuns: WorkflowRun[]): string {
  const newestDate = new Date(workflowRuns[0].created_at);
  const oldestDate = new Date(workflowRuns.at(-1)!.created_at);

  const diffTime = newestDate.getTime() - oldestDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `>=${newestDate.toISOString().split("T")[0]}`;
  } else if (diffDays <= 1) {
    const threeDaysAgo = new Date(newestDate);
    threeDaysAgo.setDate(newestDate.getDate() - 3);
    return `>=${threeDaysAgo.toISOString().split("T")[0]}`;
  } else if (diffDays <= 6) {
    const weekAgo = new Date(newestDate);
    weekAgo.setDate(newestDate.getDate() - 7);
    return `>=${weekAgo.toISOString().split("T")[0]}`;
  } else if (diffDays <= 7) {
    const twoWeeksAgo = new Date(newestDate);
    twoWeeksAgo.setDate(newestDate.getDate() - 14);
    return `>=${twoWeeksAgo.toISOString().split("T")[0]}`;
  } else {
    const monthAgo = new Date(newestDate);
    monthAgo.setMonth(newestDate.getMonth() - 1);
    return `>=${monthAgo.toISOString().split("T")[0]}`;
  }
}

// workflowRunsのトリガーがscheduleのものが全体の50%以上を占める場合、それらを除外する
export function filterScheduleRuns(
  workflowRuns: WorkflowRun[],
  forceIncludeSchedule: boolean,
): { filterd: boolean; workflowRuns: WorkflowRun[] } {
  if (forceIncludeSchedule) return { filterd: false, workflowRuns };

  const scheduleRuns = workflowRuns.filter((it) => it.event === "schedule");
  if (scheduleRuns.length / workflowRuns.length > 0.5) {
    return {
      filterd: true,
      workflowRuns: workflowRuns.filter((it) => it.event !== "schedule"),
    };
  }
  return { filterd: false, workflowRuns };
}

export async function fetchWorkflowJobsWithCache(
  github: Github,
  workflowRuns: WorkflowRun[],
  enableCache: boolean,
): Promise<WorkflowJobs> {
  if (!enableCache) return github.fetchWorkflowJobs(workflowRuns);

  const workflowJobsFromCache: WorkflowJobs = [];
  const notCachedWorkflowRuns: WorkflowRun[] = [];

  // Setup DenoKV
  const kv = await Deno.openKv();

  // Read from DenoKV
  for (const run of workflowRuns) {
    const keys = [
      run.repository.owner.login,
      run.repository.name,
      run.id,
      run.run_attempt ?? 1,
    ];
    const entry = await kv.get<WorkflowJobs[0]>(keys);
    if (entry) {
      workflowJobsFromCache.push(entry.value);
    } else {
      notCachedWorkflowRuns.push(run);
    }
  }

  // If cache does not exist, fetch and store it
  const workflowJobs = await github.fetchWorkflowJobs(notCachedWorkflowRuns);
  // for (const [i, run] of notCachedWorkflowRuns.entries()) {
  //   const keys = [
  //     run.repository.owner.login,
  //     run.repository.name,
  //     run.id,
  //     run.run_attempt ?? 1,
  //   ];
  //   await kv.set(keys, workflowJobs[i]);
  // }

  // ここまで書いて気がついたのだが、fetchWorkflowJobs()だとworkflowRunとworkflowJobがN:Nの関係になっている
  // せめて1:Nの関係にならないとキャッシュの保存ができないので、fetchWorkflowJobs()の使い方から考え直す必要がある

  // Store to DenoKV but not awaiting

  return workflowJobs;
}
