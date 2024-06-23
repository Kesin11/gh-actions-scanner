import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { JobModel, StepModel, WorkflowModel } from "../src/workflow_file.ts";
import { FileContent } from "../../github/github.ts";
import { JobAst, StepAst } from "../src/workflow_ast.ts";

const dummyWorkflow = `name: CI
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
  raw: {
    url: "https://github.com/owner/repo/blob/main/.github/workflows/dummy.yml",
  },
  content: dummyWorkflow,
} as unknown as FileContent;

describe(WorkflowModel.name, () => {
  const workflowModel = new WorkflowModel(fileContentDummy);

  it("this.obj.name", () => {
    assertEquals(workflowModel.raw.name, "CI");
  });

  it("jobs", () => {
    const actual = workflowModel.jobs;
    assertEquals(actual.length, 2);
    assertEquals(actual[0].id, "test1");
    assertEquals(actual[1].id, "test2");
  });
});

describe(JobModel.name, () => {
  const dummyJobAst = {} as unknown as JobAst;
  const baseId = "base";
  const baseJob = new JobModel(
    baseId,
    {
      "runs-on": "ubuntu-latest",
      steps: [
        { uses: "actions/checkout@v4" },
        { name: "Echo", run: "echo 'Hello, world!'" },
      ],
    },
    fileContentDummy,
    dummyJobAst,
  );

  it("isReusable", () => {
    assertEquals(baseJob.isReusable(), false);
  });

  describe("isMatrix", () => {
    it("'matrix' is not defined", () => {
      assertEquals(baseJob.isMatrix(), false);
    });

    it("'matrix' key is defined", () => {
      const matrixJob = new JobModel(
        baseId,
        {
          "runs-on": "ubuntu-latest",
          strategy: {
            matrix: {
              node: ["lts", "20"],
            },
          },
          steps: [],
        },
        fileContentDummy,
        dummyJobAst,
      );

      assertEquals(matrixJob.isMatrix(), true);
    });
  });

  describe("match", () => {
    it("'name' is defined", () => {
      const apiResponseName = "test1";
      const id = "test1";
      const expectJob = new JobModel(
        id,
        {
          "runs-on": "ubuntu-latest",
          steps: [],
        },
        fileContentDummy,
        dummyJobAst,
      );

      const actual = JobModel.match([baseJob, expectJob], apiResponseName);
      assertEquals(actual, expectJob);
    });

    it("'name' is not defined", () => {
      const apiResponseName = "named_test1";
      const id = "test1";
      const expectJob = new JobModel(
        id,
        {
          "runs-on": "ubuntu-latest",
          "name": "named_test1",
          steps: [],
        },
        fileContentDummy,
        dummyJobAst,
      );

      const actual = JobModel.match([baseJob, expectJob], apiResponseName);
      assertEquals(actual, expectJob);
    });

    it("'matrix is defined, 'name' is not defined", () => {
      const apiResponseName = "matrix_test (lts)";
      const id = "matrix_test";
      const expectJob = new JobModel(
        id,
        {
          "runs-on": "ubuntu-latest",
          strategy: {
            matrix: {
              node: ["lts", "20"],
            },
          },
          steps: [],
        },
        fileContentDummy,
        dummyJobAst,
      );

      const actual = JobModel.match([baseJob, expectJob], apiResponseName);
      assertEquals(actual, expectJob);
    });

    describe("both 'matrix' and 'name' are defined", () => {
      it("single matrix key", () => {
        const apiResponseName = "test2: node lts";
        const id = "matrix_test";
        const expectJob = new JobModel(
          id,
          {
            "runs-on": "ubuntu-latest",
            strategy: {
              matrix: {
                node: ["lts", "20"],
              },
            },
            name: "test2: node ${{ matrix.node }}",
            steps: [],
          },
          fileContentDummy,
          dummyJobAst,
        );

        const actual = JobModel.match([baseJob, expectJob], apiResponseName);
        assertEquals(actual, expectJob);
      });

      it("multiple matrix key", () => {
        const apiResponseName = "test2: node lts, os ubuntu-20.04";
        const id = "matrix_test";
        const expectJob = new JobModel(
          id,
          {
            "runs-on": "ubuntu-latest",
            strategy: {
              matrix: {
                node: ["lts", "20"],
                os: ["ubuntu-20.04", "ubutnu-22.04"],
              },
            },
            name: "test2: node ${{ matrix.node }}, os ${{ matrix.os }}",
            steps: [],
          },
          fileContentDummy,
          dummyJobAst,
        );

        const actual = JobModel.match([baseJob, expectJob], apiResponseName);
        assertEquals(actual, expectJob);
      });
    });
  });
});

describe(StepModel.name, () => {
  const dummyStepAst = {} as unknown as StepAst;
  describe("this.uses", () => {
    it("actions/checkout@v4: ref is version tag", () => {
      const stepModel = new StepModel(
        { uses: "actions/checkout@v4" },
        fileContentDummy,
        dummyStepAst,
      );
      assertEquals(stepModel.uses, { action: "actions/checkout", ref: "v4" });
    });

    it("actions/checkout@v4: ref is commit hash", () => {
      const stepModel = new StepModel(
        {
          uses: "actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11",
        },
        fileContentDummy,
        dummyStepAst,
      );
      assertEquals(stepModel.uses, {
        action: "actions/checkout",
        ref: "b4ffde65f46336ab88eb53be808477a3936bae11",
      });
    });

    it("./.github/actions/composite: Composite action", () => {
      const stepModel = new StepModel(
        {
          uses: "./.github/acitons/composite",
        },
        fileContentDummy,
        dummyStepAst,
      );
      assertEquals(stepModel.uses, {
        action: "./.github/acitons/composite",
        ref: undefined,
      });
    });
  });

  describe("this.name", () => {
    it("Only uses is defined", () => {
      const stepModel = new StepModel(
        {
          uses: "actions/checkout@v4",
        },
        fileContentDummy,
        dummyStepAst,
      );
      assertEquals(stepModel.name, "actions/checkout");
    });

    it("Both uses and name are defined", () => {
      const stepModel = new StepModel(
        {
          uses: "actions/checkout@v4",
          name: "Checkout",
        },
        fileContentDummy,
        dummyStepAst,
      );
      assertEquals(stepModel.name, "Checkout");
    });

    it("Only run is defined", () => {
      const stepModel = new StepModel(
        {
          run: "echo 'Hello, world!'",
        },
        fileContentDummy,
        dummyStepAst,
      );
      assertEquals(stepModel.name, "echo 'Hello, world!'");
    });

    it("Both run and name are defined", () => {
      const stepModel = new StepModel(
        {
          run: "echo 'Hello, world!'",
          name: "Echo",
        },
        fileContentDummy,
        dummyStepAst,
      );
      assertEquals(stepModel.name, "Echo");
    });

    it("Composite action", () => {
      const stepModel = new StepModel(
        {
          uses: "./.github/acitons/composite",
        },
        fileContentDummy,
        dummyStepAst,
      );
      assertEquals(stepModel.name, "./.github/acitons/composite");
    });
  });

  describe("match", () => {
    const preStep = new StepModel(
      { uses: "dummy/pre-step@v1" },
      fileContentDummy,
      dummyStepAst,
    );
    const namedPreStep = new StepModel(
      {
        uses: "dummy/pre-step@v1",
        name: "Pre-step",
      },
      fileContentDummy,
      dummyStepAst,
    );
    const postStep = new StepModel(
      { uses: "Kesin11/actions-timeline@v2" },
      fileContentDummy,
      dummyStepAst,
    );
    const namedPostStep = new StepModel(
      {
        uses: "Kesin11/actions-timeline@v2",
        name: "Actions-timeline",
      },
      fileContentDummy,
      dummyStepAst,
    );
    const planeStep = new StepModel(
      { uses: "actions/checkout@v4" },
      fileContentDummy,
      dummyStepAst,
    );
    const namedPlaneStep = new StepModel(
      {
        uses: "actions/checkout@v4",
        name: "Checkout",
      },
      fileContentDummy,
      dummyStepAst,
    );
    const runStep = new StepModel(
      { run: "echo 'Hello, world!'" },
      fileContentDummy,
      dummyStepAst,
    );
    const namedRunStep = new StepModel(
      {
        run: "echo 'Hello, world!'",
        name: "Echo",
      },
      fileContentDummy,
      dummyStepAst,
    );
    const stepModels = [
      preStep,
      namedPreStep,
      postStep,
      namedPostStep,
      planeStep,
      namedPlaneStep,
      runStep,
      namedRunStep,
    ];

    describe("Return undefined cases", () => {
      it("Target stepModels is undefined", () => {
        const actual = StepModel.match(undefined, "dummy/pre-step@v1");
        assertEquals(actual, undefined);
      });

      it("Set up job", () => {
        const actual = StepModel.match(stepModels, "Step up job");
        assertEquals(actual, undefined);
      });

      it("Complete job", () => {
        const actual = StepModel.match(stepModels, "Complete job");
        assertEquals(actual, undefined);
      });
    });

    it("Has pre process step", () => {
      const actual = StepModel.match(stepModels, "Pre Run dummy/pre-step@v1");
      assertEquals(actual, preStep);
    });

    it("Has pre process named step", () => {
      const actual = StepModel.match(stepModels, "Pre Pre-step");
      assertEquals(actual, namedPreStep);
    });

    it("Has post process step", () => {
      const actual = StepModel.match(
        stepModels,
        "Post Run Kesin11/actions-timeline@v2",
      );
      assertEquals(actual, postStep);
    });

    it("Has post process named step", () => {
      const actual = StepModel.match(stepModels, "Post Actions-timeline");
      assertEquals(actual, namedPostStep);
    });

    it("Plane step", () => {
      const actual = StepModel.match(stepModels, "Run actions/checkout@v4");
      assertEquals(actual, planeStep);
    });

    it("Plane named step", () => {
      const actual = StepModel.match(stepModels, "Checkout");
      assertEquals(actual, namedPlaneStep);
    });

    it("Run step", () => {
      const actual = StepModel.match(stepModels, "Run echo 'Hello, world!'");
      assertEquals(actual, runStep);
    });

    it("Run named step", () => {
      const actual = StepModel.match(stepModels, "Echo");
      assertEquals(actual, namedRunStep);
    });
  });
});
