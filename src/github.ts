import { Octokit } from "npm:@octokit/rest@20.0.2";

export type RunsSummary = {
  // 後でoctokitの型から持ってくる
  name: string;
  display_title: string;
  conslusion: string | null;
  run_attemp: number | undefined;
  run_id: number;
  workflow_id: number;
  run_started_at: string | undefined;
  usage: { // TODO: 特に適当すぎるので後で治す
    billable: {
      UBUNTU: {
        total_ms: number;
      };
    };
    run_duration_ms: number;
  };
}[];

export function createOctokit(): Octokit {
  const token = Deno.env.get("GITHUB_TOKEN");
  const baseUrl = Deno.env.get("GITHUB_API_URL") ?? "https://api.github.com";
  return new Octokit({
    auth: token,
    baseUrl,
  });
}

export async function createRunsSummary(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<RunsSummary> {
  const res = await octokit.actions.listWorkflowRunsForRepo({
    owner,
    repo,
    per_page: 20, // gh run list もデフォルトでは20件表示
  });
  const runsSummary = res.data.workflow_runs.map((run) => {
    return {
      name: run.name!,
      display_title: run.display_title,
      conslusion: run.conclusion,
      run_attemp: run.run_attempt,
      run_id: run.id,
      workflow_id: run.workflow_id,
      run_started_at: run.run_started_at,
      usage: {} as any, // 後から無理やり追加するので型は一旦anyで雑に対応
    };
  });

  // TODO: 雑に追加しすぎているので後で修正する
  // Add usage data
  for (const run of runsSummary) {
    const res = await octokit.actions.getWorkflowRunUsage({
      owner,
      repo,
      run_id: run.run_id,
    });
    run.usage = res.data;
  }

  return runsSummary;
}
