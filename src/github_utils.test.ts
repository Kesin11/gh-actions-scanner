import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { filterScheduleRuns, generateCreatedDate } from "./github_util.ts";
import type { WorkflowRun } from "@kesin11/gha-utils";

const newestDate = "2024-06-14T23:59:50Z";

describe(generateCreatedDate.name, () => {
  it(">=${TODAY} when oldestDate is today", () => {
    const workflowRuns = [
      { created_at: newestDate },
      { created_at: "2024-06-14:00:00:00Z" },
    ] as unknown as WorkflowRun[];
    assertEquals(generateCreatedDate(workflowRuns), ">=2024-06-14");
  });

  it(">=${3DAYS AGO} when oldestDate is yesterday", () => {
    const workflowRuns = [
      { created_at: newestDate },
      { created_at: "2024-06-13T00:00:00Z" },
    ] as unknown as WorkflowRun[];
    assertEquals(generateCreatedDate(workflowRuns), ">=2024-06-11");
  });

  it(">=${1WEEK AGO} when oldestDate is 6days ago", () => {
    const workflowRuns = [
      { created_at: newestDate },
      { created_at: "2024-06-08T00:00:00Z" },
    ] as unknown as WorkflowRun[];
    assertEquals(generateCreatedDate(workflowRuns), ">=2024-06-07");
  });

  it(">=${2WEEKS AGO} when oldestDate is 1week ago", () => {
    const workflowRuns = [
      { created_at: newestDate },
      { created_at: "2024-06-07T00:00:00Z" },
    ] as unknown as WorkflowRun[];
    assertEquals(generateCreatedDate(workflowRuns), ">=2024-05-31");
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

describe(filterScheduleRuns.name, () => {
  describe("when forceIncludeSchedule === true", () => {
    it("Include schedule events", () => {
      const workflowRuns = [
        { id: 1, event: "push" },
        { id: 2, event: "schedule" },
      ] as unknown as WorkflowRun[];

      const actual = filterScheduleRuns(workflowRuns, true);
      assertEquals(actual, { filterd: false, workflowRuns });
    });
  });

  describe("when forceIncludeSchedule === false", () => {
    it("Include all except schedule events", () => {
      const workflowRuns = [
        { id: 1, event: "push" },
        { id: 2, event: "pull_request" },
      ] as unknown as WorkflowRun[];

      const actual = filterScheduleRuns(workflowRuns, false);
      assertEquals(actual, { filterd: false, workflowRuns });
    });

    it("Include schedule event if workflowRuns have less than 50% schedule event ", () => {
      const workflowRuns = [
        { id: 1, event: "push" },
        { id: 2, event: "push" },
        { id: 3, event: "schedule" },
        { id: 4, event: "push" },
      ] as unknown as WorkflowRun[];

      const actual = filterScheduleRuns(workflowRuns, false);
      assertEquals(actual, { filterd: false, workflowRuns: workflowRuns });
    });

    it("Exclude schedule event if workflowRuns have more than 50% schedule event ", () => {
      const workflowRuns = [
        { id: 1, event: "push" },
        { id: 2, event: "push" },
        { id: 3, event: "schedule" },
        { id: 4, event: "schedule" },
        { id: 5, event: "schedule" },
      ] as unknown as WorkflowRun[];

      const actual = filterScheduleRuns(workflowRuns, false);
      const expected = [workflowRuns[0], workflowRuns[1]];
      assertEquals(actual, { filterd: true, workflowRuns: expected });
    });
  });
});
