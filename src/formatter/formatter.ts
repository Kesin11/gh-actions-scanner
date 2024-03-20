import type { RuleResult } from "../rules/types.ts";

interface Formatter {
  format(results: RuleResult[]): string;
}

export class JsonFormatter implements Formatter {
  constructor() {}
  format(results: RuleResult[]): string {
    return JSON.stringify(results, null, 2);
  }
}
