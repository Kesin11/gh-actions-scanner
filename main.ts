import { Octokit } from "npm:@octokit/rest";
import { groupBy} from "https://deno.land/std@0.206.0/collections/group_by.ts";
import { sumOf } from "https://deno.land/std@0.206.0/collections/sum_of.ts";

function createOctokit (): Octokit {
  const token = Deno.env.get("GITHUB_TOKEN");
  const baseUrl = Deno.env.get("GITHUB_API_URL") ?? "https://api.github.com";
  return new Octokit({
    auth: token,
    baseUrl,
  });
};


const fullname = Deno.args[0];
const [owner, repo] = fullname.split("/")
const octokit = createOctokit();

const res = await octokit.actions.listWorkflowRunsForRepo({
  owner,
  repo,
  per_page: 10
})
const runsSummary = res.data.workflow_runs.map((run) => {
  return {
    name: run.name!,
    display_title: run.display_title,
    conslusion: run.conclusion,
    run_attemp: run.run_attempt,
    run_id: run.id,
    workflow_id : run.workflow_id,
    run_started_at: run.run_started_at,
    usage: {} as any // 後から無理やり追加するので型は一旦anyで雑に対応
  }
})

for (const run of runsSummary) {
  const res = await octokit.actions.getWorkflowRunUsage({ owner, repo, run_id: run.run_id })
  run.usage = res.data
}

console.log("----runsSummary----")
console.dir(runsSummary, { depth: null })

const retriedRuns = runsSummary.filter((run) => run.run_attemp && run.run_attemp > 1)
console.log("----Retry runs----")
console.log(`${retriedRuns.length}/${runsSummary.length} runs are retried`)
if (retriedRuns.length !== 0) {
  console.dir(retriedRuns.map((run) => {
    return { workflow_name: run.name, attempt: run.run_attemp, run_id: run.run_id }
  }))
}

console.log("----Workflow count----")
const runsByWorkflow = groupBy(runsSummary, (run) => run.name)
for (const workflowName of Object.keys(runsByWorkflow)) {
  const runs = runsByWorkflow[workflowName]!
  console.log(`${workflowName}: ${runs.length} runs`)
}

console.log("----Workflow sum of usage.run_duration ----")
for (const workflowName of Object.keys(runsByWorkflow)) {
  const runs = runsByWorkflow[workflowName]!
  const sumRunDurationMs = sumOf(runs, (run) => run.usage?.run_duration_ms ?? 0)
  console.log(`${workflowName}: ${sumRunDurationMs/1000}sec `)
}
