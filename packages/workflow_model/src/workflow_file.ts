import { parse } from "https://deno.land/std@0.224.0/yaml/parse.ts";
import { zip } from "https://deno.land/std@0.224.0/collections/zip.ts";
import { FileContent } from "../../github/github.ts";
import { JobAst, StepAst, WorkflowAst } from "./workflow_ast.ts";

type Workflow = {
  name?: string;
  jobs: {
    [key: string]: Job;
  };
  [key: string]: unknown;
};
export class WorkflowModel {
  // id: string
  fileContent: FileContent;
  raw: Workflow;
  ast: WorkflowAst;
  htmlUrl?: string;
  constructor(fileContent: FileContent) {
    this.fileContent = fileContent;
    this.ast = new WorkflowAst(fileContent.content);
    this.htmlUrl = fileContent.raw.html_url ?? undefined;
    this.raw = parse(fileContent.content) as Workflow;
  }

  // NOTE: WorkflowModelは全てのrunで同一の前提として扱うのでMapで1対1の関係として扱う
  // mapでループしてMapを作成する場合のvalueは上書きで後勝ちになる
  static createWorkflowNameMap(
    workflowModels: WorkflowModel[],
  ): Map<string, WorkflowModel> {
    return new Map(workflowModels.map((it) => [it.name, it]));
  }

  // NOTE: nameが存在しないケースがあるらしいので一応ケアするが後で自分でも挙動を確認する
  // https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#name
  // >  If you omit name, GitHub displays the workflow file path relative to the root of the repository.
  get name(): string {
    return this.raw.name ?? this.fileContent.raw.path;
  }

  get jobs(): JobModel[] {
    return zip(Object.entries(this.raw.jobs), this.ast.jobAsts()).map(
      ([[id, job], jobAst]) => new JobModel(id, job, this.fileContent, jobAst),
    );
  }
}

export type Job = {
  name?: string;
  "runs-on": string;
  uses?: string;
  steps?: Step[];
  strategy?: {
    matrix?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};
export class JobModel {
  id: string;
  name?: string;
  fileContent: FileContent;
  raw: Job;
  ast: JobAst;
  htmlUrl?: string;
  constructor(
    id: string,
    obj: Job,
    fileContent: FileContent,
    ast: JobAst,
  ) {
    this.id = id;
    this.name = obj.name;
    this.raw = obj;
    this.ast = ast;
    this.fileContent = fileContent;
    this.htmlUrl = fileContent.raw.html_url ?? undefined;
  }

  get startLine(): number {
    return this.ast.startLine();
  }

  get htmlUrlWithLine(): string {
    return `${this.htmlUrl}#L${this.startLine}`;
  }

  get steps(): StepModel[] {
    const stepAsts = this.ast.stepAsts();
    if (this.raw.steps === undefined || stepAsts === undefined) return [];

    return zip(this.raw.steps, stepAsts).map(
      ([step, stepAst]) => new StepModel(step, this.fileContent, stepAst),
    );
  }

  static match(
    jobModels: JobModel[] | undefined,
    rawName: string,
  ): JobModel | undefined {
    if (jobModels === undefined) return undefined;

    for (const jobModel of jobModels) {
      if (jobModel.id === rawName) return jobModel;
      if (jobModel.name === rawName) return jobModel;

      if (jobModel.isMatrix()) {
        // case: 'name' is not defined
        if (rawName.startsWith(jobModel.id)) return jobModel;

        if (jobModel.name === undefined) continue;
        // case: 'name' is defined
        // NOTE: If matrix has multiple keys, it maybe can not possible to perfect match.
        const trimedName = jobModel.name.replace(/\$\{\{.+\}\}/g, "").trim();
        if (rawName.includes(trimedName)) return jobModel;
      }
    }

    return undefined;
  }

  isMatrix(): boolean {
    if (this.raw.strategy?.matrix !== undefined) return true;
    return false;
  }

  isReusable(): boolean {
    // Local reusable workflow
    if (this.raw.uses?.startsWith("./")) return true;

    // TODO: Remote reusable workflow

    return false;
  }
}

export type Step = {
  uses?: string;
  name?: string;
  run?: string;
  with?: Record<string, unknown>;
  [key: string]: unknown;
};
export class StepModel {
  raw: Step;
  name: string;
  uses?: { // actions/checkout@v4 => { action: actions/checkout, ref: v4 }
    action: string;
    ref?: string;
  };
  ast: StepAst;
  htmlUrl?: string;
  constructor(
    obj: Step,
    fileContent: FileContent,
    ast: StepAst,
  ) {
    this.raw = obj;
    this.uses = obj.uses
      ? { action: obj.uses.split("@")[0], ref: obj.uses.split("@")[1] }
      : undefined;
    this.name = obj.name ?? obj.run ?? this.uses?.action ?? "";
    this.ast = ast;
    this.htmlUrl = fileContent.raw.html_url ?? undefined;
  }

  get startLine(): number {
    return this.ast.startLine();
  }

  get htmlUrlWithLine(): string {
    return `${this.htmlUrl}#L${this.startLine}`;
  }

  static match(
    stepModels: StepModel[] | undefined,
    rawName: string,
  ): StepModel | undefined {
    if (stepModels === undefined) return undefined;
    if (rawName === "Set up job" || rawName === "Complete job") {
      return undefined;
    }

    // NOTE: stepのAPIの `name` はnameが存在すればnameそのまま, なければ`Run ${uses}`がnameに入っている
    // nameもusesも`Pre `, `Post `のprefixが付くstepが存在する
    // さらにusesの場合はPre Run, Post Runのprefixになる
    const name = rawName.replace(/^(Pre Run |Post Run |Pre |Run |Post )/, "");
    const action = name.split("@")[0];
    for (const stepModel of stepModels) {
      // case: rawName comes from step.name or step.run
      if (stepModel.name === name) return stepModel;
      // case: rawName comes from step.uses
      if (stepModel.uses?.action === action) return stepModel;
    }
    // case: no match
    return undefined;
  }

  isComposite(): boolean {
    // Call self as action
    if (this.raw.uses === "./") return false;

    // Local composite action
    if (this.raw.uses?.startsWith("./")) return true;

    // TODO: Remote composite action

    return false;
  }
}

// type ReusableWorkflow = {
//   name: string;
//   on: {
//     workflow_call: unknown;
//   };
//   jobs: Record<string, Job>;
// };
// export class ReusableWorkflowModel {
//   yaml: string;
//   raw: ReusableWorkflow;
//   constructor(rawYaml: string) {
//     this.yaml = rawYaml;
//     this.raw = parse(rawYaml) as ReusableWorkflow;
//   }

//   get jobs(): JobModel[] {
//     return Object.entries(this.raw.jobs).map(([id, job]) =>
//       new JobModel(id, job)
//     );
//   }
// }

// type CompositeAction = {
//   name: string;
//   description: string | undefined;
//   runs: {
//     using: "composite";
//     steps: Step[];
//   };
// };
// export class CompositeStepModel {
//   yaml: string;
//   raw: CompositeAction;
//   constructor(rawYaml: string) {
//     this.yaml = rawYaml;
//     this.raw = parse(rawYaml) as CompositeAction;
//   }

//   get steps(): StepModel[] {
//     return this.raw.runs.steps.map((step) => new StepModel(step));
//   }
// }
