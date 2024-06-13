export class RuleExecutionError extends Error {
  override readonly name = "RuleExecuteError" as const;
  constructor(message: string, options?: { cause: unknown }) {
    super(message, options);
    this.cause = options?.cause;
  }
}
