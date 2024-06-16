import type { WorkflowRun } from "../packages/github/github.ts";

export function generateCreatedDate(workflowRuns: WorkflowRun[]): string {
  return `>=${new Date().toISOString().split("T")[0]}`; // Default is yesterday of <YYYY-MM-DD format.
}
