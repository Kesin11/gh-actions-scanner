import {
  load,
  safeLoad,
  type YamlMap,
  type YAMLMapping,
  YAMLSequence,
} from "npm:yaml-ast-parser@0.0.43";
import { StructuredSource } from "npm:structured-source@4.0.0";

export type SourceLines = [number, number]; // [start, end]

export class WorkflowAst {
  ast: YamlMap;
  src: StructuredSource;
  constructor(yaml: string) {
    this.ast = load(yaml) as YamlMap; // rootは確定でYamlMap型
    this.src = new StructuredSource(yaml);
  }

  jobAsts(): JobAst[] {
    const jobsMap = this.ast.mappings.find((it) => it.key.value === "jobs")
      ?.value as YamlMap; // jobsは必ず存在し確定でYamlMap
    return jobsMap.mappings.map((it) => new JobAst(it, this.src));
  }
}

export class JobAst {
  ast: YAMLMapping;
  src: StructuredSource;
  constructor(ast: YAMLMapping, src: StructuredSource) {
    this.ast = ast;
    this.src = src;
  }

  stepAsts(): StepAst[] {
    const jobMap = this.ast.value as YamlMap;
    const stepsSeq = jobMap.mappings.find((it) => it.key.value === "steps")
      ?.value as YAMLSequence; // stepsは必ず存在し確定でYAMLSequence;
    return stepsSeq.items.map((it) => new StepAst(it as YAMLMapping, this.src));
  }

  lines(): SourceLines {
    // MEMO: StructuredSourceの方は改行が文字数カウントに含まれているので+1されていて、最初が0から始まるので
    // ASTのendから見ると2文字ずれてる？

    // stepAstの方は一見合っているので、最後のstepのendPositionを使ってみる
    const jobMap = this.ast.value as YamlMap;
    const stepsSeq = jobMap.mappings.find((it) => it.key.value === "steps")
      ?.value as YAMLSequence; // stepsは必ず存在し確定でYAMLSequence;
    const finalStepAst = new StepAst(
      stepsSeq.items.at(-1)! as YAMLMapping,
      this.src,
    );

    const loc = this.src.rangeToLocation([
      this.ast.startPosition,
      finalStepAst.ast.endPosition,
      // this.ast.endPosition,
    ]);
    return [loc.start.line, loc.end.line];
  }
}

export class StepAst {
  ast: YAMLMapping;
  src: StructuredSource;
  constructor(ast: YAMLMapping, src: StructuredSource) {
    this.ast = ast;
    this.src = src;
  }

  lines(): SourceLines {
    const loc = this.src.rangeToLocation([
      this.ast.startPosition,
      this.ast.endPosition,
    ]);
    return [loc.start.line, loc.end.line];
  }
}
