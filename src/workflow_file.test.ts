import { assertEquals } from "https://deno.land/std@0.212.0/assert/mod.ts";
import {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.212.0/testing/bdd.ts";
import { JobModel, StepModel, WorkflowModel } from "./workflow_file.ts";
import { FileContent } from "./github.ts";

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
  const fileContentDummy = {
    raw: undefined,
    content: yaml,
  } as unknown as FileContent;
  const workflowModel = new WorkflowModel(fileContentDummy);

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

describe(JobModel.name, () => {
  const id = "test1";
  const base = new JobModel(id, {
    "runs-on": "ubuntu-latest",
    steps: [
      { uses: "actions/checkout@v4" },
      { name: "Echo", run: "echo 'Hello, world!'" },
    ],
  });

  it("isReusable", () => {
    assertEquals(base.isReusable(), false);
  });

  it("steps", () => {
    assertEquals(base.steps.length, 2);
  });

  describe("isMatrix", () => {
    it("matrix key is not defined", () => {
      assertEquals(base.isMatrix(), false);
    });

    it("matrix key is defined", () => {
      const matrixJob = new JobModel(id, {
        "runs-on": "ubuntu-latest",
        strategy: {
          matrix: {
            node: ["lts", "20"],
          },
        },
        steps: [
          { uses: "actions/checkout@v4" },
          { name: "Echo", run: "echo 'Hello, world!'" },
        ],
      });

      assertEquals(matrixJob.isMatrix(), true);
    });
  });

  // await t.step("match()", () => { });
});

Deno.test(StepModel.name, async (t) => {
  const step = { uses: "actions/checkout@v4" };
  const stepModel = new StepModel(step);

  await t.step("this.obj.uses", () => {
    assertEquals(stepModel.raw.uses, "actions/checkout@v4");
  });

  await t.step("isComposite", () => {
    assertEquals(stepModel.isComposite(), false);
  });
});
