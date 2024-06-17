import type { RuleResult, Severity } from "./rules/types.ts";

const severityRank = {
  high: 0,
  medium: 1,
  low: 2,
  unknown: 3,
} as const;

export function translateRules(
  results: RuleResult[],
  allowSeverities: Severity[],
): RuleResult[] {
  return sortRules(filterSeverity(results, allowSeverities));
}

export function filterSeverity(
  results: RuleResult[],
  allowSeverities: Severity[],
): RuleResult[] {
  return results.filter((result) => allowSeverities.includes(result.severity));
}

// RuleResultを以下の順序でソートする
// 1. severityの低い順
// 2. fixable
// 3. ruleIdのalphabet順
export function sortRules(results: RuleResult[]): RuleResult[] {
  return results.sort((a, b) => {
    const aRank = severityRank[a.severity];
    const bRank = severityRank[b.severity];
    if (aRank !== bRank) {
      return aRank - bRank;
    }
    if (a.fixable !== b.fixable) {
      return a.fixable ? -1 : 1;
    }
    return a.ruleId.localeCompare(b.ruleId);
  });
}
