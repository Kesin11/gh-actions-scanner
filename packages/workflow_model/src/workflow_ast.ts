import {
  safeLoad,
  type YamlMap,
  type YAMLMapping,
  YAMLSequence,
} from "npm:yaml-ast-parser@0.0.43";
import { StructuredSource } from "npm:structured-source@4.0.0";

export class WorkflowAst {
  ast: YamlMap;
  src: StructuredSource;
  constructor(yaml: string) {
    this.ast = safeLoad(yaml) as YamlMap; // rootは確定でYamlMap型
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

  stepAsts(): StepAst[] | undefined {
    const jobMap = this.ast.value as YamlMap;
    // stepsが存在すればYAMLSequence, Reusable workflowはstepsが存在しないのでundefined
    const stepsSeq = jobMap.mappings.find((it) => it.key.value === "steps")
      ?.value as YAMLSequence | undefined;
    if (stepsSeq === undefined) return undefined;

    return stepsSeq.items.map((it) => new StepAst(it as YAMLMapping, this.src));
  }

  startLine(): number {
    const pos = this.src.indexToPosition(
      this.ast.startPosition,
    );
    return pos.line;
  }
}

export class StepAst {
  ast: YAMLMapping;
  src: StructuredSource;
  constructor(ast: YAMLMapping, src: StructuredSource) {
    this.ast = ast;
    this.src = src;
  }

  startLine(): number {
    const pos = this.src.indexToPosition(
      this.ast.startPosition,
    );
    return pos.line;
  }
}
