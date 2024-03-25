import { assertEquals } from "https://deno.land/std@0.212.0/assert/mod.ts";
import {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.212.0/testing/bdd.ts";
import {
  reportActiveCache,
  THRESHOLD_CACHE_SIZE_GB,
} from "./cache_active_size.ts";
import { ActionsCacheUsage } from "../../packages/github/github.ts";

describe("cache_active_size", () => {
  describe(reportActiveCache.name, () => {
    beforeEach(() => {
    });

    it("Cache size is below the threshold", async () => {
      const activeCache = {
        active_caches_size_in_bytes: 1_000_000_000,
      } as ActionsCacheUsage;
      const ruleResult = (await reportActiveCache(activeCache))[0];
      assertEquals(ruleResult.severity, "low");
      assertEquals(ruleResult.description, "Show active cache size");
      assertEquals(
        ruleResult.messages[0],
        "Active Cache size in bytes(GB): 1.0 (MAX 10GB)",
      );
    });

    it("Cache size is over the threshold", async () => {
      const activeCache = {
        active_caches_size_in_bytes: (THRESHOLD_CACHE_SIZE_GB * 1000 * 1000 *
          1000),
      } as ActionsCacheUsage;
      const ruleResult = (await reportActiveCache(activeCache))[0];
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
