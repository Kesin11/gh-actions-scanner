import {
  assertEquals,
  assertInstanceOf,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { join } from "https://deno.land/std@0.221.0/path/mod.ts";
import { JobAst, StepAst, WorkflowAst } from "../src/workflow_ast.ts";

describe("workflow_ast.yaml", () => {
  const fixture = Deno.readTextFileSync(
    join(import.meta.dirname!, "./fixtures/workflow_ast.yaml"),
  );
  const workflowAst = new WorkflowAst(fixture);

  describe(WorkflowAst.name, () => {
    it("constructor", () => {
      assertInstanceOf(workflowAst, WorkflowAst);
    });
  });

  describe(JobAst.name, () => {
    const jobsAsts = workflowAst.jobAsts();
    describe("stepAsts()", () => {
      it("reusable workflow has not any steps", () => {
        const ast = jobsAsts[3];
        assertEquals(ast.stepAsts(), undefined);
      });
    });

    describe("startLine()", () => {
      it("deno", () => {
        const ast = jobsAsts[0];
        assertEquals(ast.startLine(), 4);
      });

      it("use_matrix", () => {
        const ast = jobsAsts[1];
        assertEquals(ast.startLine(), 18);
      });

      it("use_composite", () => {
        const ast = jobsAsts[2];
        assertEquals(ast.startLine(), 37);
      });

      it("use_reusable", () => {
        const ast = jobsAsts[3];
        assertEquals(ast.startLine(), 45);
      });
    });
  });

  describe(StepAst.name, () => {
    const jobsAst = workflowAst.jobAsts().at(0)!;
    const stepAsts = jobsAst.stepAsts()!;
    describe("startLine()", () => {
      it("one line", () => {
        const ast = stepAsts[0];
        assertEquals(ast.startLine(), 7);
      });
      it("multi line", () => {
        const ast = stepAsts[1];
        assertEquals(ast.startLine(), 8);
      });

      it("use_composite multi line", () => {
        const jobsAst = workflowAst.jobAsts().at(2)!;
        const stepAsts = jobsAst.stepAsts()!;
        const ast = stepAsts[2];
        assertEquals(ast.startLine(), 42);
      });
    });
  });
});

describe("ci.yaml", () => {
  const fixture = Deno.readTextFileSync(
    join(import.meta.dirname!, "./fixtures/multi_byte.yaml"),
  );
  const workflowAst = new WorkflowAst(fixture);

  describe(WorkflowAst.name, () => {
    it("constructor", () => {
      assertInstanceOf(workflowAst, WorkflowAst);
    });
  });

  describe(JobAst.name, () => {
    const jobsAsts = workflowAst.jobAsts();

    describe("startLine()", () => {
      it("check", () => {
        const ast = jobsAsts[0];
        assertEquals(ast.startLine(), 14);
      });

      it("my_repo_test", () => {
        const ast = jobsAsts[1];
        assertEquals(ast.startLine(), 34);
      });
    });
  });

  describe(StepAst.name, () => {
    const jobsAst = workflowAst.jobAsts().at(1)!;
    const stepAsts = jobsAst.stepAsts()!;
    describe("startLine()", () => {
      it("my_repo_test one line", () => {
        const ast = stepAsts[0];
        assertEquals(ast.startLine(), 39);
      });
      it("my_repo_test multi line", () => {
        const ast = stepAsts[1];
        assertEquals(ast.startLine(), 40);
      });
    });
  });
});
