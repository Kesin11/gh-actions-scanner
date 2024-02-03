import { assertEquals } from "https://deno.land/std@0.212.0/assert/mod.ts";
import {
  JobModel,
  StepModel,
  WorkflowModel,
} from "./src/rules/workflow_file.ts";

Deno.test(WorkflowModel.name, async (t) => {
  // before的なものを書きたければここに
  // 無理そうならtddのモジュールを持ってくる
  const yaml = `
name: CI
on:
  push:
  workflow_dispatch:
jobs:
  test1:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Echo
        run: echo "Hello, world!"
  test2:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
  `;
  const workflowModel = new WorkflowModel(yaml);

  await t.step("this.obj.name", () => {
    assertEquals(workflowModel.raw.name, "CI");
  });

  await t.step("jobs", () => {
    const actual = workflowModel.jobs;
    assertEquals(actual.length, 2);
    assertEquals(actual[0].id, "test1");
    assertEquals(actual[1].id, "test2");
  });
});

Deno.test(JobModel.name, async (t) => {
  const id = "test1";
  const job = {
    "runs-on": "ubuntu-latest",
    steps: [
      { uses: "actions/checkout@v4" },
      { name: "Echo", run: "echo 'Hello, world!'" },
    ],
  };
  const jobModel = new JobModel(id, job);

  await t.step("this.obj.runs-on", () => {
    assertEquals(jobModel.raw["runs-on"], "ubuntu-latest");
  });

  await t.step("steps", () => {
    assertEquals(jobModel.steps.length, 2);
  });

  // await t.step("match()", () => { });
});

Deno.test(StepModel.name, async (t) => {
  const step = { uses: "actions/checkout@v4" };
  const stepModel = new StepModel(step);

  await t.step("this.obj.uses", () => {
    assertEquals(stepModel.raw.uses, "actions/checkout@v4");
  });
});
