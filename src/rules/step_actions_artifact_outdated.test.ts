import { basename } from "https://deno.land/std@0.224.0/path/basename.ts";
import {
  assertEquals,
  assertGreater,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { checkSlowArtifactAction } from "./step_actions_artifact_outdated.ts";
import type { JobSummary } from "../workflow_summariser.ts";
import type { RuleArgs } from "./types.ts";

const filename = basename(import.meta.url);

describe(filename, () => {
  describe(checkSlowArtifactAction.name, () => {
    it("should return [] when duration.p90 <= 60", async () => {
      const jobSummaries = [{
        stepSummaries: [{
          durationStatSecs: {
            p90: 60,
          },
          stepModel: {
            uses: { action: "actions/download-artifact", ref: "v3" },
            raw: { action: "actions/checkout@v3" },
          },
        }],
      }] as unknown as JobSummary[];

      const actual = await checkSlowArtifactAction(
        { jobSummaries } as RuleArgs,
      );
      assertEquals(actual, []);
    });

    it("should return [] when duration.p90 > 60 and action version > v3", async () => {
      const jobSummaries = [{
        stepSummaries: [{
          durationStatSecs: {
            p90: 61,
          },
          stepModel: {
            uses: { action: "actions/download-artifact", ref: "v4" },
            raw: { action: "actions/checkout@v4" },
          },
        }],
      }] as unknown as JobSummary[];

      const actual = await checkSlowArtifactAction(
        { jobSummaries } as RuleArgs,
      );
      assertEquals(actual, []);
    });

    it("should return 'high' severity result when duration.p90 > 60 and action version <= v3", async () => {
      const jobSummaries = [{
        stepSummaries: [{
          durationStatSecs: {
            p90: 61,
          },
          stepModel: {
            uses: { action: "actions/download-artifact", ref: "v3" },
            raw: { action: "actions/checkout@v3" },
          },
        }],
      }] as unknown as JobSummary[];

      const actual = await checkSlowArtifactAction(
        { jobSummaries } as RuleArgs,
      );
      assertGreater(actual.length, 0);
      assertEquals(actual[0].severity, "high");
    });
  });
});
