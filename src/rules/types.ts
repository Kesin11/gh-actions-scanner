export const severityList = ["high", "medium", "low", "unknown"] as const;
export type Severity = typeof severityList[number];
export type RuleResult = {
  ruleId: string;
  ruleUrl?: string;
  severity: Severity;
  fixable: boolean;
  description: string;
  codeUrl?: string;
  messages: string[];
  helpMessage?: string;
  code?: string;
  data?: unknown;
};
