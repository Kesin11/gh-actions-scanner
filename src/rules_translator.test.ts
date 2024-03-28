import { assertEquals } from "https://deno.land/std@0.212.0/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.212.0/testing/bdd.ts";
import type { RuleResult } from "./rules/types.ts";
import { filterSeverity, sortRules } from "./rules_translator.ts";

describe("rules_translator", () => {
  describe(filterSeverity.name, () => {
    const results = [
      { ruleId: "rule1", severity: "high" },
      { ruleId: "rule2", severity: "medium" },
      { ruleId: "rule3", severity: "low" },
      { ruleId: "rule4", severity: "unknown" },
    ] as RuleResult[];
    it("Filter only given severity", () => {
      const actual = filterSeverity(results, ["high", "medium"]);
      assertEquals(actual, [
        { ruleId: "rule1", severity: "high" },
        { ruleId: "rule2", severity: "medium" },
      ] as RuleResult[]);
    });
  });

  describe(sortRules.name, () => {
    it("Sort by severity", () => {
      const results = [
        { ruleId: "b-rule", severity: "medium", fixable: true },
        { ruleId: "a-rule", severity: "high", fixable: true },
      ] as RuleResult[];

      const actual = sortRules(results);
      assertEquals(actual, [
        { ruleId: "a-rule", severity: "high", fixable: true },
        { ruleId: "b-rule", severity: "medium", fixable: true },
      ] as RuleResult[]);
    });

    it("Sort by fixable", () => {
      const results = [
        { ruleId: "b-rule", severity: "high", fixable: false },
        { ruleId: "a-fixable-rule", severity: "high", fixable: true },
      ] as RuleResult[];

      const actual = sortRules(results);
      assertEquals(actual, [
        { ruleId: "a-fixable-rule", severity: "high", fixable: true },
        { ruleId: "b-rule", severity: "high", fixable: false },
      ] as RuleResult[]);
    });

    it("Sort by ruleId alphabetically", () => {
      const results = [
        { ruleId: "b-rule", severity: "high", fixable: true },
        { ruleId: "a-rule", severity: "high", fixable: true },
      ] as RuleResult[];

      const actual = sortRules(results);
      assertEquals(actual, [
        { ruleId: "a-rule", severity: "high", fixable: true },
        { ruleId: "b-rule", severity: "high", fixable: true },
      ] as RuleResult[]);
    });

    it("Sort by severity, fixable, ruleId", () => {
      const results = [
        { ruleId: "b-m-fixable", severity: "medium", fixable: true },
        { ruleId: "a-h", severity: "high", fixable: false },
        { ruleId: "b-h-fixable", severity: "high", fixable: true },
        { ruleId: "c-m", severity: "medium", fixable: false },
        { ruleId: "b-m", severity: "medium", fixable: false },
      ] as RuleResult[];

      const actual = sortRules(results);
      assertEquals(actual, [
        { ruleId: "b-h-fixable", severity: "high", fixable: true },
        { ruleId: "a-h", severity: "high", fixable: false },
        { ruleId: "b-m-fixable", severity: "medium", fixable: true },
        { ruleId: "b-m", severity: "medium", fixable: false },
        { ruleId: "c-m", severity: "medium", fixable: false },
      ] as RuleResult[]);
    });
  });
});
