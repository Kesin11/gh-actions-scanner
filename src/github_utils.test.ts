import { assertEquals } from "https://deno.land/std@0.212.0/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.212.0/testing/bdd.ts";
import { generateCreatedDate } from "./github_util.ts";
import type { WorkflowRun } from "../packages/github/github.ts";

const newestDate = "2024-06-14T23:59:50Z";

describe(generateCreatedDate.name, () => {
  it(">=${YESTERDAY} when oldestDate is today", () => {
    const workflowRuns = [
      { created_at: newestDate },
      { created_at: "2024-06-14:00:00:00Z" },
    ] as unknown as WorkflowRun[];
    assertEquals(generateCreatedDate(workflowRuns), ">=2024-06-14");
  });

  it(">=${1WEEK AGO} when oldestDate is yesterday", () => {
    const workflowRuns = [
      { created_at: newestDate },
      { created_at: "2024-06-13T00:00:00Z" },
    ] as unknown as WorkflowRun[];
    assertEquals(generateCreatedDate(workflowRuns), ">=2024-06-07");
  });

  it(">=${1WEEK AGO} when oldestDate is 6days ago", () => {
    const workflowRuns = [
      { created_at: newestDate },
      { created_at: "2024-06-08T00:00:00Z" },
    ] as unknown as WorkflowRun[];
    assertEquals(generateCreatedDate(workflowRuns), ">=2024-06-07");
  });

  it(">=${1MONTH AGO} when oldestDate is 1week ago", () => {
    const workflowRuns = [
      { created_at: newestDate },
      { created_at: "2024-06-07T00:00:00Z" },
    ] as unknown as WorkflowRun[];
    assertEquals(generateCreatedDate(workflowRuns), ">=2024-05-14");
  });

  it(">=${1MONTH AGO} when oldestDate is 30days ago", () => {
    const workflowRuns = [
      { created_at: newestDate },
      { created_at: "2024-05-15T00:00:00Z" },
    ] as unknown as WorkflowRun[];
    assertEquals(generateCreatedDate(workflowRuns), ">=2024-05-14");
  });

  it(">=${1MONTH AGO} when oldestDate is 31days ago", () => {
    const workflowRuns = [
      { created_at: newestDate },
      { created_at: "2024-05-14T00:00:00Z" },
    ] as unknown as WorkflowRun[];
    assertEquals(generateCreatedDate(workflowRuns), ">=2024-05-14");
  });
});
