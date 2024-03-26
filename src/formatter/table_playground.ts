import chalk from "npm:chalk@5.3.0";
import { table } from "npm:table@6.8.1";
import { RuleResult } from "../rules/types.ts";
import { getBorderCharacters } from "npm:table@6.8.1";
import { TableUserConfig } from "npm:table@6.8.1";
import { stringify } from "https://deno.land/std@0.212.0/yaml/stringify.ts";

const results = [
  {
    ruleId: "actions-scanner/step_action_checkout_depth0",
    ruleUrl:
      "https://github.com/gh-actions-scanner/doc/rules/step_action_checkout_depth0.md",
    severity: "high",
    fixable: true,
    description: "actions/checkout with 'fetch-depth: 0' is slow",
    codeUrl:
      "https://github.com/kesin11-private/gh-actions-scanner/blob/45e430b56e6731eeb9ae9369de72802e9802bef9/.github/workflows/ci.yaml#L23-L25",
    messages: [
      `actions/checkout with 'fetch-depth: 0' is slow. It takes p90 30 sec`,
    ],
    helpMessage: `Recommend to use 'with.filter: blob:none'`,
    code: `${
      stringify({
        "uses": { "action": "actions/checkout", "with": { "fetch-depth": 0 } },
      })
    }`,
  },
  {
    ruleId: "actions-scanner/cache_active_size",
    ruleUrl:
      "https://github.com/gh-actions-scanner/doc/rules/step_action_checkout_depth0.md",
    severity: "medium",
    fixable: true,
    description: "cache size near reach to limit",
    messages: [
      `cache size is too large. It takes 9.5GB / 10GB`,
      `See repository cache list. https://github.com/kesin11-private/gh-actions-scanner/actions/caches`,
    ],
    helpMessage: `Recommend to reduce cache size`,
    codeUrl: undefined,
  },
  {
    ruleId: "actions-scanner/workflow_count",
    ruleUrl:
      "https://github.com/gh-actions-scanner/doc/rules/step_action_checkout_depth0.md",
    severity: "low",
    fixable: false,
    description: "Workflow run count",
    messages: [
      `workflow count is too large. It takes 100 workflows`,
      `workflow count is too large. It takes 200 workflows`,
    ],
    helpMessage: "",
    codeUrl: undefined,
  },
];

const tableConfig: TableUserConfig = {
  border: {
    ...getBorderCharacters("honeywell"),
    // topBody: "",
    // topJoin: "",
    // topLeft: "",
    // topRight: "",

    // bottomLeft: "",
    // bottomRight: "",

    // bodyLeft: "",
    // bodyRight: "",

    // joinLeft: "",
    // joinRight: "",
  },
  // drawHorizontalLine: (lineIndex: number) => {
  //   return lineIndex === 1;
  // },
};

function formatTable(results: RuleResult[]) {
  return results.map((
    result,
  ) => {
    const data = [];
    switch (result.severity) {
      case "high":
        data.push([
          `${chalk.red(result.severity.toUpperCase())}: ${result.description}`,
        ]);
        break;
      case "medium":
        data.push([
          `${
            chalk.yellow(result.severity.toUpperCase())
          }: ${result.description}`,
        ]);
        break;
      case "low":
        data.push([
          `${chalk.blue(result.severity.toUpperCase())}: ${result.description}`,
        ]);
        break;
      case "unknown":
        data.push([
          `${chalk.gray(result.severity.toUpperCase())}: ${result.description}`,
        ]);
        break;
    }
    data.push([result.messages.join("\n")]);
    if (result.helpMessage) {
      data.push([
        chalk.gray(`${result.helpMessage}\n\nSee: ${result.ruleUrl}`),
      ]);
    }
    if (result.codeUrl) {
      data.push([`${chalk.blue(result.codeUrl)}`]);
    }
    if (result.code) {
      data.push([result.code]);
    }
    return data;
  });
}

formatTable(results).forEach((data) => {
  console.log(table(data, tableConfig));
});
