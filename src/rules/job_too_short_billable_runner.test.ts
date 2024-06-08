import { basename } from "https://deno.land/std@0.221.0/path/basename.ts";
import {
  assertEquals,
  assertGreater,
} from "https://deno.land/std@0.212.0/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.212.0/testing/bdd.ts";
import { checkTooShortBillableJob } from "./job_too_short_billable_runner.ts";
import type { RuleArgs } from "./types.ts";
import type { JobSummary } from "../workflow_summariser.ts";

const filename = basename(import.meta.url);

describe(filename, () => {
  describe(checkTooShortBillableJob.name, () => {
    it("should return [] when no jobs that duration too short", async () => {
      const jobSummaries = [{
        billableStatSecs: {
          UBUNTU: {
            median: 60,
          },
        },
      }] as unknown as JobSummary[];

      const actual = await checkTooShortBillableJob(
        { jobSummaries } as RuleArgs,
      );
      assertEquals(actual, []);
    });

    it("should return [] when no jobs that duration too short and its larger runner", async () => {
      const jobSummaries = [{
        billableStatSecs: {
          "ubuntu_8_core": {
            median: 60,
          },
        },
      }] as unknown as JobSummary[];

      const actual = await checkTooShortBillableJob(
        { jobSummaries } as RuleArgs,
      );
      assertEquals(actual, []);
    });

    it("should return [] when jobs that duration too short but standard runner", async () => {
      const jobSummaries = [{
        billableStatSecs: {
          UBUNTU: {
            median: 59,
          },
        },
      }] as unknown as JobSummary[];

      const actual = await checkTooShortBillableJob(
        { jobSummaries } as RuleArgs,
      );
      assertEquals(actual, []);
    });

    it("should return 'medium' severity result when jobs that duration longer than threshold and its larger runner", async () => {
      const jobSummaries = [{
        workflowModel: {
          name: "workflow1",
        },
        jobModel: {
          id: "job1",
        },
        billableStatSecs: {
          "ubuntu_8_core": {
            median: 59,
          },
        },
      }] as unknown as JobSummary[];

      const actual = await checkTooShortBillableJob(
        { jobSummaries } as RuleArgs,
      );
      assertGreater(actual.length, 0);
      assertEquals(actual[0].severity, "medium");
    });
  });
});
