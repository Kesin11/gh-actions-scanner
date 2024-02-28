import { parse } from "https://deno.land/std@0.212.0/yaml/parse.ts";
import { FileContent } from "./github.ts";

type Workflow = {
  name?: string;
  jobs: {
    [key: string]: Job;
  };
  [key: string]: unknown;
};
export class WorkflowModel {
  // TODO: Jobではjob_idを入れているので、一貫性を考えるならrun_idを持つべきかもしれない？
  // id: string
  fileContent: FileContent;
  raw: Workflow;
  constructor(fileContent: FileContent) {
    this.fileContent = fileContent;
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
    return Object.entries(this.raw.jobs).map(([id, job]) =>
      new JobModel(id, job)
    );
  }

  // TODO: Jobの知識をworkflowが持っているのはおかしいのでJobModelのstaticに移動する
  // jobのAPIの `name` はnameが存在すればname, なければidが入るので両方で引けるようにkvを作成する
  jobsMap(): Map<string, JobModel> {
    const maps = new Map(this.jobs.map((it) => [it.id, it]));
    this.jobs.filter((it) => it.name !== undefined)
      .forEach((it) => {
        maps.set(it.name!, it);
      });
    return maps;
  }
}

type ReusableWorkflow = {
  name: string;
  on: {
    workflow_call: unknown;
  };
  jobs: Record<string, Job>;
};
export class ReusableWorkflowModel {
  yaml: string;
  raw: ReusableWorkflow;
  constructor(rawYaml: string) {
    this.yaml = rawYaml;
    this.raw = parse(rawYaml) as ReusableWorkflow;
  }

  get jobs(): JobModel[] {
    return Object.entries(this.raw.jobs).map(([id, job]) =>
      new JobModel(id, job)
    );
  }
}

export type Job = {
  name?: string;
  "runs-on": string;
  uses?: string;
  steps?: Step[];
  [key: string]: unknown;
};
export class JobModel {
  id: string;
  name?: string;
  raw: Job;
  constructor(id: string, obj: Job) {
    this.id = id;
    this.name = obj.name;
    this.raw = obj;
  }

  get steps(): StepModel[] {
    if (this.raw.steps === undefined) return [];
    return this.raw.steps?.map((step) => new StepModel(step));
  }

  // TODO: Stepの知識をJobが持っているのはおかしいのでStepModelのstaticに移動する
  // stepのAPIの `name` はnameが存在すればnameそのまま, なければ`Run ${uses}`がnameに入っている
  // nameもusesも`Pre `, `Post `のprefixが付くstepが存在する
  stepsMap(): Map<string, StepModel> {
    const steps = this.steps;
    const maps = new Map(steps.map((it) => [it.name, it]));
    this.steps.forEach((it) => {
      maps.set(`Pre ${it.name}`, it);
      maps.set(`Run ${it.name}`, it);
      maps.set(`Post ${it.name}`, it);
    });
    return maps;
  }

  match(options: { id: string; name: string }): boolean {
    if (this.id === options.id) return true;
    // matrixも考慮。startWithで多分大丈夫？
    if (this.raw.name && this.raw.name.startsWith(options.name)) return true;
    return false;
  }

  isMatrix(): boolean {
    return true; // TODO: implement
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
  [key: string]: unknown;
};
export class StepModel {
  raw: Step;
  name: string;
  constructor(obj: Step) {
    this.raw = obj;
    this.name = obj.name ?? obj.uses ?? obj.run ?? "";
  }

  get showable(): string {
    return this.raw.name ?? this.raw.uses ?? this.raw.run ??
      "Error: Not showable step";
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

type CompositeAction = {
  name: string;
  description: string | undefined;
  runs: {
    using: "composite";
    steps: Step[];
  };
};
export class CompositeStepModel {
  yaml: string;
  raw: CompositeAction;
  constructor(rawYaml: string) {
    this.yaml = rawYaml;
    this.raw = parse(rawYaml) as CompositeAction;
  }

  get steps(): StepModel[] {
    return this.raw.runs.steps.map((step) => new StepModel(step));
  }
}
