// reusableやcompositeが多様されたworkflowを展開して流れを把握できるようにするスクリプト
// イメージとしてはnpm lsのように依存関係をツリー、もしくはインデントで表現したい
//
// サンプルの出力イメージ
// main (.github/workflows/medianAbsoluteDeviation.yaml):
//  build:
//    - checkout
//    - run: echo
//    - uses: ../.github/actions/my-compisite (https://github.com/owner/repo/.github/actions/my-compisite/action.yml)
//      - run: build
//      - run: test
//      - uses: ../.github/actions/common (https://github.com/owner/repo/.github/actions/common/action.yml)
//        - run: post.sh
//  reusable: (../.github/workflows/reusable.yml)
//    - lint:
//      - uses: ../.github/actions/my-composite (https://github.com/owner/repo/.github/actions/my-composite/action.yml)
//        - run: build
//        - run: test
//      - run: lint

import { Github } from "./src/github.ts";
import { WorkflowModel } from "./src/rules/workflow_file.ts";

const fullname = Deno.args[0];
const [owner, repo] = fullname.split("/");
const workflow = Deno.args[1];
const ref = Deno.args[2] || "main"; // とりあえずmain固定
if (!(workflow.endsWith(".yml") || workflow.endsWith(".yaml"))) {
  // 最終的にはymlでもworkflow_nameでもどっちでもいけるようにしたい
  throw new Error("workflow argument must be .yml or .yaml");
}
const github = new Github();
const workflowPath = `.github/workflows/${workflow}`;
const [content] = await github.fetchContent([{
  owner,
  repo,
  path: workflowPath,
  ref,
}]);

const workflowModel = new WorkflowModel(content!);
console.log(`workflow: ${workflowModel.raw.name}`);
for (const job of workflowModel.jobs) {
  console.log(`  job:${job.id}`);
  for (const step of job.steps) {
    console.log(`    step: ${step.showable}`);
  }
}
