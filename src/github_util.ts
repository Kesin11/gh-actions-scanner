import type { WorkflowRun } from "../packages/github/github.ts";

// workflowRunsの中で最も古いcreatedを取得し、
// 今日なら一日前、
// 昨日なら1週間前、
// 1週間以上前なら一ヶ月前、
// 一ヶ月以上前でも一ヶ月前、
// のcreatedの文字列を返す関数
export function generateCreatedDate(workflowRuns: WorkflowRun[]): string {
  const newestDate = new Date(workflowRuns[0].created_at);
  const oldestDate = new Date(workflowRuns.at(-1)!.created_at);

  const diffTime = newestDate.getTime() - oldestDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `>=${newestDate.toISOString().split("T")[0]}`;
  } else if (diffDays <= 6) {
    const weekAgo = new Date(newestDate);
    weekAgo.setDate(newestDate.getDate() - 7);
    return `>=${weekAgo.toISOString().split("T")[0]}`;
  } else {
    const monthAgo = new Date(newestDate);
    monthAgo.setMonth(newestDate.getMonth() - 1);
    return `>=${monthAgo.toISOString().split("T")[0]}`;
  }
}
