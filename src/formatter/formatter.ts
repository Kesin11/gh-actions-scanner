import type { RuleResult } from "../rules/types.ts";
import chalk from "npm:chalk@5.3.0";
import { getBorderCharacters, table, TableUserConfig } from "npm:table@6.8.1";

interface Formatter {
  format(results: RuleResult[]): string;
}

export class JsonFormatter implements Formatter {
  constructor() {}
  format(results: RuleResult[]): string {
    return JSON.stringify(results, null, 2);
  }
}

export class TableFormatter implements Formatter {
  constructor() {}
  format(results: RuleResult[]): string {
    const tableConfig: TableUserConfig = {
      columnDefault: {
        width: 150,
      },
      border: {
        ...getBorderCharacters("honeywell"),
        // topBody: "",
        // topJoin: "",
        topLeft: "",
        topRight: "",
        bottomLeft: "",
        bottomRight: "",
        bodyLeft: "",
        bodyRight: "",
        joinLeft: "",
        joinRight: "",
      },
    };
    const resultTable = this.createTables(results).map((data) =>
      table(data, tableConfig)
    )
      .join("");
    const totalString = this.createTotalText(results);

    return `${resultTable}\n${totalString}`;
  }

  createSeverityText(severity: RuleResult["severity"]): string {
    switch (severity) {
      case "high":
        return chalk.red(severity.toUpperCase());
      case "medium":
        return chalk.yellow(severity.toUpperCase());
      case "low":
        return chalk.blue(severity.toUpperCase());
      case "unknown":
        return chalk.gray(severity.toUpperCase());
    }
  }

  createTables(results: RuleResult[]): string[][][] {
    return results.map((
      result,
    ) => {
      const data: string[][] = [];
      // {severity}: {description}
      data.push([
        `${this.createSeverityText(result.severity)}: ${result.description}`,
      ]);

      // {messages}
      data.push([result.messages.join("\n")]);
      if (result.helpMessage) {
        data.push([
          chalk.gray(`${result.helpMessage}\n\nSee: ${result.ruleUrl}`),
        ]);
      }
      // {codeUrl} ex: https://github.com/owner/repo/blob/main/file.ts#L1-L2
      if (result.codeUrl) {
        data.push([`${chalk.blue(result.codeUrl)}`]);
      }
      // {code}
      if (result.code) {
        data.push([result.code]);
      }

      return data;
    });
  }

  createTotalText(results: RuleResult[]): string {
    const high = results.filter((result) => result.severity === "high").length;
    const medium =
      results.filter((result) => result.severity === "medium").length;
    const low = results.filter((result) => result.severity === "low").length;
    const unknown =
      results.filter((result) => result.severity === "unknown").length;

    return `Total: ${results.length} (HIGH: ${high}, MEDIUM: ${medium}, LOW: ${low}, UNKNOWN: ${unknown})`;
  }
}
