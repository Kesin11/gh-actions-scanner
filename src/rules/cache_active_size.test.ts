import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  reportActiveCache,
  THRESHOLD_CACHE_SIZE_GB,
} from "./cache_active_size.ts";
import type { ActionsCacheUsage } from "../../packages/github/github.ts";
import type { RuleArgs } from "./types.ts";

describe("cache_active_size", () => {
  describe(reportActiveCache.name, () => {
    beforeEach(() => {
    });

    it("Cache size is below the threshold", async () => {
      const actionsCacheUsage = {
        active_caches_size_in_bytes: 1 * 1024 * 1024 * 1024,
      } as ActionsCacheUsage;
      const ruleResult =
        (await reportActiveCache({ actionsCacheUsage } as RuleArgs))[0];
      assertEquals(ruleResult.severity, "low");
      assertEquals(ruleResult.description, "Show active cache size");
      assertEquals(
        ruleResult.messages[0],
        "Active Cache size in bytes(GB): 1.0 (MAX 10GB)",
      );
    });

    it("Cache size is over the threshold", async () => {
      const actionsCacheUsage = {
        active_caches_size_in_bytes: (THRESHOLD_CACHE_SIZE_GB * 1024 * 1024 *
          1024),
      } as ActionsCacheUsage;
      const ruleResult =
        (await reportActiveCache({ actionsCacheUsage } as RuleArgs))[0];
      assertEquals(ruleResult.severity, "medium");
      assertEquals(
        ruleResult.description,
        "Cache size will soon reach its MAX limit",
      );
      assertEquals(
        ruleResult.messages[0],
        "Cache size will soon reach its MAX limit. It's using 9.0GB / 10GB",
      );
    });
  });
});
