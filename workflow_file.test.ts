import { assertEquals } from "https://deno.land/std@0.212.0/assert/mod.ts";
import {
  JobModel,
  StepModel,
  WorkflowModel,
} from "./src/rules/workflowFile.ts";

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
    const obj = workflowModel.obj;
    assertEquals(obj.name, "CI");
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
  await t.step("this.obj.runs-on", () => {
    const actual = new JobModel(id, job).obj;
    assertEquals(actual["runs-on"], "ubuntu-latest");
  });

  await t.step("steps", () => {
    const actual = new JobModel(id, job).steps;
    assertEquals(actual.length, 2);
  });

  // await t.step("match()", () => { });
});

Deno.test(StepModel.name, async (t) => {
  const step = { uses: "actions/checkout@v4" };
  await t.step("this.obj.uses", () => {
    const actual = new StepModel(step).obj;
    assertEquals(actual.uses, "actions/checkout@v4");
  });
});
