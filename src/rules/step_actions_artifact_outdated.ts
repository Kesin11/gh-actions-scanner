import type { RuleResult } from "./types.ts";
import { distinctBy } from "https://deno.land/std@0.218.2/collections/distinct_by.ts";
import type { JobSummary } from "../workflow_summariser.ts";
import { stringify } from "https://deno.land/std@0.212.0/yaml/stringify.ts";

const meta = {
  ruleId: "actions-scanner/step_old_action_artifact",
  ruleUrl: undefined,
  fixable: true,
};

const THRESHOLD_DURATION_SEC = 60;
const THRESHOLD_VERSION = "v3";

// stepSummaries.durationStatSecsが一定以上 && actions/download-artifact@v3を使っている場合はv4を推奨する
// deno-lint-ignore require-await
export async function checkSlowArtifactAction(
  jobSummaries: JobSummary[],
): Promise<RuleResult[]> {
  // 全てのjobを捜査してactions/download-artifact OR actions/upload-artifactを使っているstepSummariesを抽出
  const artifactSteps = [];
  for (const job of jobSummaries) {
    for (const step of job.stepSummaries) {
      const action = step.stepModel?.uses?.action;
      if (
        action === "actions/upload-artifact" ||
        action === "actions/download-artifact"
      ) {
        artifactSteps.push(step);
      }
    }
  }

  // その中でdurationStatSecs.p90が一定以上 && uses.refがv3のものを抽出
  const targetSteps = artifactSteps.filter((step) => {
    return (step.durationStatSecs.p90 &&
      step.durationStatSecs.p90 > THRESHOLD_DURATION_SEC);
  }).filter((step) => step.stepModel?.uses?.ref === THRESHOLD_VERSION);

  // TODO: refがハッシュ値だった場合はGitHubのAPIを使ってタグ名を取得してv4にアップデートを推奨する
  const reportedSteps = distinctBy(targetSteps, (step) => step.stepModel?.raw);

  return reportedSteps.map((step) => {
    return {
      ...meta,
      description:
        "actions/upload-artifact@v3 and actions/downlowad-artifact@v3 are slower than v4",
      severity: "high",
      messages: [
        `Artifact action ${THRESHOLD_VERSION} take a long time. It takes ${step.durationStatSecs.p90} secs at p90`,
      ],
      helpMessage: `Recommend to update v4`,
      code: (step.stepModel?.raw) ? stringify(step.stepModel?.raw) : undefined,
      codeUrl: step.stepModel?.htmlUrlWithLine,
      data: reportedSteps,
    };
  });
}
