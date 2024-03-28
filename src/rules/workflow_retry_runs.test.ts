import { assertEquals } from "https://deno.land/std@0.212.0/assert/mod.ts";
import {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.212.0/testing/bdd.ts";
import { reportWorkflowRetryRuns } from "./workflow_retry_runs.ts";
import { type RunsSummary } from "../workflow_summariser.ts";

describe("workflow_retry_runs", () => {
  describe(reportWorkflowRetryRuns.name, () => {
    beforeEach(() => {
    });

    it("has not any retried workflows", async () => {
      const runsSummary = [
        {
          name: "dummy",
          run_attemp: 1,
          run_id: 1,
        },
      ] as RunsSummary;
      const actual = await reportWorkflowRetryRuns(runsSummary);
      assertEquals(
        actual,
        [],
      );
    });

    it("has retried workflow", async () => {
      const runsSummary = [
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
      ] as RunsSummary;
      const actual = await reportWorkflowRetryRuns(runsSummary);
      assertEquals(
        actual[0].messages,
        ["dummy1: 1/2 runs are retried."],
      );
    });
  });
});
