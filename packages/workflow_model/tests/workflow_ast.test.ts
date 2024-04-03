import {
  assertEquals,
  assertInstanceOf,
} from "https://deno.land/std@0.212.0/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.212.0/testing/bdd.ts";
import { join } from "https://deno.land/std@0.221.0/path/mod.ts";
import { JobAst, StepAst, WorkflowAst } from "../src/workflow_ast.ts";

// TODO
// - linesが正常に動いていること
//   なぜかyaml-astとsrcで2文字ずれてる。pocのときには問題なかったので何が違うのか？
// - reusableで動くこと
// - yamlにマルチバイト文字が含まれていても動くこと

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

    describe("lines()", () => {
      it("deno", () => {
        const ast = jobsAsts[0];
        assertEquals(ast.lines(), [4, 16]);
      });

      it("use_matrix", () => {
        const ast = jobsAsts[1];
        assertEquals(ast.lines(), [18, 35]);
      });

      it("use_composite", () => {
        const ast = jobsAsts[2];
        assertEquals(ast.lines(), [37, 43]);
      });

      it("use_reusable", () => {
        const ast = jobsAsts[3];
        assertEquals(ast.lines(), [45, 48]);
      });
    });
  });

  describe(StepAst.name, () => {
    const jobsAst = workflowAst.jobAsts().at(0)!;
    const stepAsts = jobsAst.stepAsts();
    it("one line", () => {
      const ast = stepAsts[0];
      assertEquals(ast.lines(), [7, 7]);
    });
    it("multi line", () => {
      const ast = stepAsts[1];
      assertEquals(ast.lines(), [8, 10]);
    });

    it("use_composite multi line", () => {
      const jobsAst = workflowAst.jobAsts().at(2)!;
      const stepAsts = jobsAst.stepAsts();
      const ast = stepAsts[2];
      assertEquals(ast.lines(), [42, 43]);
    });
  });
});

describe("ci.yaml", () => {
  const fixture = Deno.readTextFileSync(
    join(import.meta.dirname!, "../../../.github/workflows/ci.yaml"),
  );
  const workflowAst = new WorkflowAst(fixture);

  describe(WorkflowAst.name, () => {
    it("constructor", () => {
      assertInstanceOf(workflowAst, WorkflowAst);
    });
  });

  describe(JobAst.name, () => {
    const jobsAsts = workflowAst.jobAsts();

    describe("lines()", () => {
      it("check", () => {
        const ast = jobsAsts[0];
        assertEquals(ast.lines(), [14, 32]);
      });

      it("my_repo_test", () => {
        const ast = jobsAsts[1];
        assertEquals(ast.lines(), [33, 48]);
      });
    });
  });

  describe(StepAst.name, () => {
    const jobsAst = workflowAst.jobAsts().at(1)!;
    const stepAsts = jobsAst.stepAsts();
    it("my_repo_test one line", () => {
      const ast = stepAsts[0];
      assertEquals(ast.lines(), [37, 37]);
    });
    it("my_repo_test multi line", () => {
      const ast = stepAsts[1];
      assertEquals(ast.lines(), [38, 41]);
    });
  });
});
