// ユーザーが用意するconfig fileのサンプル
// 自作のruleの.tsをgithubで公開すればそれをimport可能

// プライベートリポジトリの場合はPATをセットしておく必要がある
// export DENO_AUTH_TOKENS=$(gh auth token)@raw.githubusercontent.com
// ref: https://docs.deno.com/runtime/manual/basics/modules/private

import { reportWorkflowUsage } from "https://raw.githubusercontent.com/kesin11-private/gh-actions-scanner/main/src/rules/workflow_run_usage.ts";
import { RuleFunc } from "https://raw.githubusercontent.com/kesin11-private/gh-actions-scanner/main/src/rules/types.ts";

type Config = {
  rules: RuleFunc[];
};

const config: Config = {
  rules: [
    reportWorkflowUsage,
  ],
};
export default config;
