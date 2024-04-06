import { basename } from "https://deno.land/std@0.221.0/path/basename.ts";
import {
  assertEquals,
  assertGreater,
} from "https://deno.land/std@0.212.0/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.212.0/testing/bdd.ts";
import { checkCheckoutFilterBlobNone } from "./step_actions_checkout_depth0.ts";
import { JobSummary } from "../workflow_summariser.ts";

const filename = basename(import.meta.url);

describe(filename, () => {
  describe(checkCheckoutFilterBlobNone.name, () => {
    describe("should return []", () => {
      it("when actions/checkout@v4 p90 <= 30 and no fetch-depth option", async () => {
        const jobSummaries = [{
          stepSummaries: [{
            durationStatSecs: { p90: 30 },
            stepModel: {
              uses: { action: "actions/checkout", ref: "v4" },
              raw: { action: "actions/checkout@v4" },
            },
          }],
        }] as unknown as JobSummary[];
        const actual = await checkCheckoutFilterBlobNone(jobSummaries);
        assertEquals(actual, []);
      });

      it("when actions/checkout p90 <= 30 and fetch-depth === 0", async () => {
        const jobSummaries = [{
          stepSummaries: [{
            durationStatSecs: { p90: 30 },
            stepModel: {
              uses: { action: "actions/checkout", ref: "v4" },
              raw: {
                action: "actions/checkout@v4",
                with: { "fetch-depth": 0 },
              },
            },
          }],
        }] as unknown as JobSummary[];
        const actual = await checkCheckoutFilterBlobNone(jobSummaries);
        assertEquals(actual, []);
      });

      it("when actions/checkout p90 > 30 and no fetch-depth option", async () => {
        const jobSummaries = [{
          stepSummaries: [{
            durationStatSecs: { p90: 31 },
            stepModel: {
              uses: { action: "actions/checkout", ref: "v4" },
              raw: {
                action: "actions/checkout@v4",
              },
            },
          }],
        }] as unknown as JobSummary[];
        const actual = await checkCheckoutFilterBlobNone(jobSummaries);
        assertEquals(actual, []);
      });

      it("when actions/checkout p90 > 30 and fetch-depth !== 0", async () => {
        const jobSummaries = [{
          stepSummaries: [{
            durationStatSecs: { p90: 31 },
            stepModel: {
              uses: { action: "actions/checkout", ref: "v4" },
              raw: {
                action: "actions/checkout@v4",
                with: { "fetch-depth": "10" },
              },
            },
          }],
        }] as unknown as JobSummary[];
        const actual = await checkCheckoutFilterBlobNone(jobSummaries);
        assertEquals(actual, []);
      });

      it("when actions/checkout p90 > 30 and fetch-depth === 0 and 'filter' has some value", async () => {
        const jobSummaries = [{
          stepSummaries: [{
            durationStatSecs: { p90: 31 },
            stepModel: {
              uses: { action: "actions/checkout", ref: "v4" },
              raw: {
                action: "actions/checkout@v4",
                with: { "fetch-depth": 0, "filter": "blob:none" },
              },
            },
          }],
        }] as unknown as JobSummary[];
        const actual = await checkCheckoutFilterBlobNone(jobSummaries);
        assertEquals(actual, []);
      });
    });

    describe("should return 'high' severity result", () => {
      it("when actions/checkout p90 > 30 and fetch-depth === 0(number)", async () => {
        const jobSummaries = [{
          stepSummaries: [{
            durationStatSecs: { p90: 31 },
            stepModel: {
              uses: { action: "actions/checkout", ref: "v4" },
              raw: {
                action: "actions/checkout@v4",
                with: { "fetch-depth": 0 },
              },
            },
          }],
        }] as unknown as JobSummary[];
        const actual = await checkCheckoutFilterBlobNone(jobSummaries);
        assertGreater(actual.length, 0);
        assertEquals(actual[0].severity, "high");
      });

      it("when actions/checkout p90 > 30 and fetch-depth === 0(string)", async () => {
        const jobSummaries = [{
          stepSummaries: [{
            durationStatSecs: { p90: 31 },
            stepModel: {
              uses: { action: "actions/checkout", ref: "v4" },
              raw: {
                action: "actions/checkout@v4",
                with: { "fetch-depth": "0" },
              },
            },
          }],
        }] as unknown as JobSummary[];
        const actual = await checkCheckoutFilterBlobNone(jobSummaries);
        assertGreater(actual.length, 0);
        assertEquals(actual[0].severity, "high");
      });
    });
  });
});
