// ユーザーが用意するconfig fileのサンプル

// import { reportCacheList } from "./rules/cache_list.ts";
// import { reportActiveCache } from "./rules/cache_active_size.ts";
import { reportWorkflowUsage } from "./src/rules/workflow_run_usage.ts";
// import { workflowCountStat } from "./rules/workflow_count_stat.ts";
// import { reportWorkflowRetryRuns } from "./rules/workflow_retry_runs.ts";
// import { checkSlowArtifactAction } from "./rules/step_actions_artifact_outdated.ts";
// import { checkCheckoutFilterBlobNone } from "./rules/step_actions_checkout_depth0.ts";
// import { checkTooShortBillableJob } from "./rules/job_too_short_billable_runner.ts";
import { RuleFunc } from "./src/rules/types.ts";

type Config = {
  rules: RuleFunc[];
};

const config: Config = {
  rules: [
    reportWorkflowUsage,
  ],
};
export default config;
