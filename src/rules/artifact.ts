import { distinctBy } from "https://deno.land/std@0.218.2/collections/distinct_by.ts";
import { JobsSummary } from "../workflow_summariser.ts";

const THRESHOLD_DURATION_SEC = 60;
const THRESHOLD_VERSION = "v3";

// stepsSummary.durationStatSecsが一定以上 && actions/download-artifact@v3を使っている場合はv4を推奨する
export async function checkSlowArtifactAction(jobsSummary: JobsSummary) {
  console.log("----checkSlowArtifactAction----");
  // 全てのjobを捜査してactions/download-artifact OR actions/upload-artifactを使っているstepsSummaryを抽出
  const artifactSteps = Object.values(jobsSummary).flatMap((jobs) => {
    return Object.values(jobs).flatMap((job) => {
      return Object.values(job.stepsSummary).filter((step) => {
        const action = step.stepModel?.uses?.action;
        return action === "actions/upload-artifact" ||
          action === "actions/download-artifact";
      });
    });
  });

  // その中でdurationStatSecs.p90が一定以上 && uses.refがv3のものを抽出
  const targetSteps = artifactSteps.filter((step) => {
    return (step.durationStatSecs.p90 &&
      step.durationStatSecs.p90 > THRESHOLD_DURATION_SEC);
  }).filter((step) => step.stepModel?.uses?.ref === THRESHOLD_VERSION);

  // TODO: refがハッシュ値だった場合はGitHubのAPIを使ってタグ名を取得してv4にアップデートを推奨する
  const reportedSteps = distinctBy(targetSteps, (step) => step.stepModel?.raw)
    .map((step) => {
      console.warn(
        `Artifact action ${THRESHOLD_VERSION} is slow. Recommend to update v4`,
        step.stepModel?.raw,
      );
      return step;
    });

  // TODO:
  return reportedSteps;
}
