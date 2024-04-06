import { basename } from "https://deno.land/std@0.221.0/path/basename.ts";
import {
  assertEquals,
  assertGreater,
} from "https://deno.land/std@0.212.0/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.212.0/testing/bdd.ts";
import { checkSlowArtifactAction } from "./step_actions_artifact_outdated.ts";
import { JobSummary } from "../workflow_summariser.ts";

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
            uses: {
              action: "actions/download-artifact",
              ref: "v3",
            },
          },
        }],
      }] as unknown as JobSummary[];

      const actual = await checkSlowArtifactAction(jobSummaries);
      assertEquals(actual, []);
    });

    it("should return [] when duration.p90 > 60 and action version > v3", async () => {
      const jobSummaries = [{
        stepSummaries: [{
          durationStatSecs: {
            p90: 61,
          },
          stepModel: {
            uses: {
              action: "actions/download-artifact",
              ref: "v4",
            },
          },
        }],
      }] as unknown as JobSummary[];

      const actual = await checkSlowArtifactAction(jobSummaries);
      assertEquals(actual, []);
    });

    it("should return 'high' severity result when duration.p90 > 60 and action version <= v3", async () => {
      const jobSummaries = [{
        stepSummaries: [{
          durationStatSecs: {
            p90: 61,
          },
          stepModel: {
            uses: {
              action: "actions/download-artifact",
              ref: "v3",
            },
          },
        }],
      }] as unknown as JobSummary[];

      const actual = await checkSlowArtifactAction(jobSummaries);
      assertGreater(actual.length, 0);
      assertEquals(actual[0].severity, "high");
    });
  });
});
