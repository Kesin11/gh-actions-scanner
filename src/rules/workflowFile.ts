import { parse } from "https://deno.land/std@0.212.0/yaml/parse.ts";

type Workflow = {
  name: string;
  jobs: {
    [key: string]: Job;
  };
};
export class WorkflowModel {
  raw: string;
  obj: Workflow;
  constructor(rawYaml: string) {
    this.raw = rawYaml;
    this.obj = parse(rawYaml) as Workflow;
  }

  get jobs(): JobModel[] {
    return Object.entries(this.obj.jobs).map(([id, job]) =>
      new JobModel(id, job)
    );
  }
}

type Job = {
  name?: string;
  "runs-on": string;
  steps: Step[];
};
export class JobModel {
  id: string;
  obj: Job;
  constructor(id: string, obj: Job) {
    this.id = id;
    this.obj = obj;
  }

  get steps(): StepModel[] {
    return this.obj.steps.map((step) => new StepModel(step));
  }

  match(options: { id: string; name: string }): boolean {
    if (this.id === options.id) return true;
    // matrixも考慮。startWithで多分大丈夫？
    if (this.obj.name && this.obj.name.startsWith(options.name)) return true;
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
};
export class StepModel {
  obj: Step;
  constructor(obj: Step) {
    this.obj = obj;
  }

  isComposite(): boolean {
    return true;
  }
}
