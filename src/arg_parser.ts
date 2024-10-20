import { Command, EnumType } from "@cliffy/command";
import { formatterList } from "./formatter/formatter.ts";
import { severityList } from "./rules/types.ts";

const formatterType = new EnumType(formatterList);
const severityType = new EnumType(severityList);
export async function argParse() {
  const { options, args: _args } = await new Command()
    .name("actions-scanner")
    .description(
      "Scan GitHub Actions workflows and report performance issues.",
    )
    .option(
      "-t, --token <token:string>",
      "GitHub token. ex: $(gh auth token)",
      {
        default: undefined,
      },
    )
    .option(
      "-R, --repo <repo_fullname:string>",
      "Fullname of repository. OWNER/REPO format",
      { required: true },
    )
    .option(
      "--created <created:string>",
      "Returns workflow runs created within the given date-time range. ex: >=YYYY-MM-DD, YYYY-MM-DD..YYYY-MM-DD. If omit this option, it created by range of recent runs date. For more information on the syntax, see https://docs.github.com/search-github/getting-started-with-searching-on-github/understanding-the-search-syntax#query-for-dates",
      {
        default: undefined,
      },
    )
    .option(
      "--host <host:string>",
      "GitHub host. Specify your GHES host If you will use it on GHES",
      { default: undefined },
    )
    .option(
      "--config <config:string>",
      "config file path. Default: actions-scanner.config.ts . If actions-scanner.config.ts is not found, use included default config.",
      { default: undefined },
    )
    .type("format", formatterType)
    .option(
      "-f, --format <name:format>",
      `Formatter name. Default: "table". Available: ${formatterType.values()}`,
      {
        default: "table",
      },
    )
    .type("severity", severityType)
    .option(
      "-s, --severity <items:severity[]>",
      `Severities of filter result. Pass to camma separated string. Available: ${severityType.values()}`,
      {
        separator: ",",
        default: severityType.values(),
      },
    )
    .option(
      "--workflow-file-ref <workflow_file_ref:string>",
      "Git ref for workflow files that will use showing url at result. Default: Repository main branch",
      { default: undefined },
    )
    .option(
      "--force-include-schedule [force_include_schedule:boolean]",
      "Force schedule workflow jobs to be included in the scan. By default, if there are too many schedule jobs, these are filtered.. Default: false",
      { default: false },
    )
    .option(
      "--debug [debug:boolean]",
      "Enable debug log. Default: false",
      { default: false },
    )
    .parse(Deno.args);

  return options;
}
