export type RuleResult = {
  ruleId: string;
  ruleUrl?: string;
  severity: "high" | "medium" | "low" | "unknown";
  fixable: boolean;
  messages: string[];
  helpMessage?: string;
  data?: unknown;
};
