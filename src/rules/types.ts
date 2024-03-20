export type RuleResult = {
  ruleId: string;
  ruleUrl?: string;
  severity: "error" | "warn" | "info";
  fixable: boolean;
  messages: string[];
  helpMessage?: string;
  data?: unknown;
};
