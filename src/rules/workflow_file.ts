import { parse } from "https://deno.land/std@0.212.0/yaml/parse.ts";

type Workflow = {
  name: string;
  jobs: {
    [key: string]: Job;
  };
  [key: string]: unknown;
};
export class WorkflowModel {
  yaml: string;
  raw: Workflow;
  constructor(rawYaml: string) {
    this.yaml = rawYaml;
    this.raw = parse(rawYaml) as Workflow;
  }

  get jobs(): JobModel[] {
    return Object.entries(this.raw.jobs).map(([id, job]) =>
      new JobModel(id, job)
    );
  }
}

type Job = {
  name?: string;
  "runs-on": string;
  steps: Step[];
  [key: string]: unknown;
};
export class JobModel {
  id: string;
  raw: Job;
  constructor(id: string, obj: Job) {
    this.id = id;
    this.raw = obj;
  }

  get steps(): StepModel[] {
    return this.raw.steps.map((step) => new StepModel(step));
  }

  match(options: { id: string; name: string }): boolean {
    if (this.id === options.id) return true;
    // matrixも考慮。startWithで多分大丈夫？
    if (this.raw.name && this.raw.name.startsWith(options.name)) return true;
    return false;
  }

  isReusable(): boolean {
    return true;
  }

  isMatrix(): boolean {
    return true;
  }
}

type Step = {
  uses?: string;
  name?: string;
  run?: string;
  [key: string]: unknown;
};
export class StepModel {
  raw: Step;
  constructor(obj: Step) {
    this.raw = obj;
  }

  get showable(): string {
    return this.raw.name ?? this.raw.uses ?? this.raw.run ??
      "Error: Not showable step";
  }

  isComposite(): boolean {
    return true;
  }
}
