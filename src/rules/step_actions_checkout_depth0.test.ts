import { basename } from "@std/path";
import { assertEquals, assertGreater } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { checkCheckoutFilterBlobNone } from "./step_actions_checkout_depth0.ts";
import type { JobSummary } from "../workflow_summariser.ts";
import type { RuleArgs } from "./types.ts";

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
        const actual = await checkCheckoutFilterBlobNone(
          { jobSummaries } as RuleArgs,
        );
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
        const actual = await checkCheckoutFilterBlobNone(
          { jobSummaries } as RuleArgs,
        );
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
        const actual = await checkCheckoutFilterBlobNone(
          { jobSummaries } as RuleArgs,
        );
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
        const actual = await checkCheckoutFilterBlobNone(
          { jobSummaries } as RuleArgs,
        );
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
        const actual = await checkCheckoutFilterBlobNone(
          { jobSummaries } as RuleArgs,
        );
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
        const actual = await checkCheckoutFilterBlobNone(
          { jobSummaries } as RuleArgs,
        );
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
        const actual = await checkCheckoutFilterBlobNone(
          { jobSummaries } as RuleArgs,
        );
        assertGreater(actual.length, 0);
        assertEquals(actual[0].severity, "high");
      });
    });
  });
});
