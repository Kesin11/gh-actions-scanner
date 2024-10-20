import { assertEquals } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { reportWorkflowRetryRuns } from "./workflow_retry_runs.ts";
import type { RunSummary } from "../workflow_summariser.ts";
import type { RuleArgs } from "./types.ts";

describe("workflow_retry_runs", () => {
  describe(reportWorkflowRetryRuns.name, () => {
    beforeEach(() => {
    });

    it("has not any retried workflows", async () => {
      const runSummaries = [
        {
          name: "dummy",
          run_attemp: 1,
          run_id: 1,
        },
      ] as RunSummary[];
      const actual = await reportWorkflowRetryRuns(
        { runSummaries } as RuleArgs,
      );
      assertEquals(
        actual,
        [],
      );
    });

    it("has retried workflow", async () => {
      const runSummaries = [
        {
          name: "dummy1",
          run_attemp: 1,
          run_id: 1,
        },
        {
          name: "dummy1",
          run_attemp: 2,
          run_id: 1,
        },
        {
          name: "dummy2",
          run_attemp: 1,
          run_id: 2,
        },
      ] as RunSummary[];
      const actual = await reportWorkflowRetryRuns(
        { runSummaries } as RuleArgs,
      );
      assertEquals(
        actual[0].messages,
        ["dummy1: 1/2 runs are retried."],
      );
    });
  });
});
