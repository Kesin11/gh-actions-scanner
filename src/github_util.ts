import type { WorkflowRun } from "../packages/github/github.ts";

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
