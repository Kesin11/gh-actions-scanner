import { basename } from "@std/path";
import { assertEquals, assertGreater } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { checkTooShortBillableJob } from "./job_too_short_billable_runner.ts";
import type { RuleArgs } from "./types.ts";
import type { JobSummary } from "../workflow_summariser.ts";

const filename = basename(import.meta.url);

describe(filename, () => {
  describe(checkTooShortBillableJob.name, () => {
    describe("standard runner", () => {
      it("should return [] when no jobs that duration too short", async () => {
        const jobSummaries = [{
          durationStatSecs: {
            median: 60,
          },
          billableStatSecs: {
            "UBUNTU": {
              median: 60,
            },
          },
        }] as unknown as JobSummary[];

        const actual = await checkTooShortBillableJob(
          { jobSummaries } as RuleArgs,
        );
        assertEquals(actual, []);
      });

      it("should return [] when jobs that duration too short", async () => {
        const jobSummaries = [{
          durationStatSecs: {
            median: 59,
          },
          billableStatSecs: {
            "UBUNTU": {
              median: 60,
            },
          },
        }] as unknown as JobSummary[];

        const actual = await checkTooShortBillableJob(
          { jobSummaries } as RuleArgs,
        );
        assertEquals(actual, []);
      });
    });

    describe("larger runner", () => {
      it("should return [] when no jobs that duration too short and its larger runner", async () => {
        const jobSummaries = [{
          durationStatSecs: {
            median: 60,
          },
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

      it("should return 'medium' severity result when jobs that duration longer than threshold and its larger runner", async () => {
        const jobSummaries = [{
          workflowModel: {
            name: "workflow1",
          },
          jobModel: {
            id: "job1",
          },
          durationStatSecs: {
            median: 59,
          },
          billableStatSecs: {
            "ubuntu_8_core": {
              median: 60,
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
});
