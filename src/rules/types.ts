export type RuleResult = {
  ruleId: string;
  ruleUrl?: string;
  severity: "high" | "medium" | "low" | "unknown";
  fixable: boolean;
  description: string;
  codeUrl?: string;
  messages: string[];
  helpMessage?: string;
  code?: string;
  data?: unknown;
};
