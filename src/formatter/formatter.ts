import type { RuleResult } from "../rules/types.ts";
import chalk from "chalk";
import { getBorderCharacters, table, TableUserConfig } from "table";

export const formatterList = ["json", "table"] as const;
export type FormatterType = typeof formatterList[number];

export class Formatter {
  formatter: IFormatter;
  constructor(formatter: typeof formatterList[number]) {
    switch (formatter) {
      case "json":
        this.formatter = new JsonFormatter();
        break;
      case "table":
        this.formatter = new TableFormatter();
        break;
    }
  }

  format(results: RuleResult[]): string {
    return this.formatter.format(results);
  }
}

interface IFormatter {
  format(results: RuleResult[]): string;
}

export class JsonFormatter implements IFormatter {
  constructor() {}
  format(results: RuleResult[]): string {
    return JSON.stringify(results, null, 2);
  }
}

export class TableFormatter implements IFormatter {
  constructor() {}
  format(results: RuleResult[]): string {
    const CONSOLE_PADDING = 2;
    const DEFAULT_COLUMN_WIDTH = 150;
    const tableConfig: TableUserConfig = {
      columnDefault: {
        width: Deno.env.get("CI")
          ? DEFAULT_COLUMN_WIDTH
          : Deno.consoleSize().columns - CONSOLE_PADDING,
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
          chalk.gray(`${result.helpMessage}`),
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
