import {
  safeLoad,
  YamlMap,
  YAMLMapping,
  YAMLSequence,
} from "npm:yaml-ast-parser@0.0.43";
import { StructuredSource } from "npm:structured-source@4.0.0";

const yaml = Deno.readTextFileSync(".github/workflows/ci.yaml").toString();
const root = safeLoad(yaml) as YamlMap; // rootは確定でYamlMap
const jobsMap = root.mappings.find((it) => it.key.value === "jobs")
  ?.value as YamlMap; // jobsは必ず存在するので確定でYamlMap
const jobs = jobsMap.mappings.map((it) => ({
  key: it.key.value,
  start: it.key.startPosition,
  end: it.key.endPosition,
}));
console.log(jobs);

const src = new StructuredSource(yaml);
jobs.forEach((it) => {
  // GItHubのリンクは行単位までらしいのでindexToPositionで十分そう
  console.log(`${it.key}:`, src.indexToPosition(it.start));
  console.log(`${it.key}:`, src.rangeToLocation([it.start, it.end]));
});

const firstJob = jobsMap.mappings[0].value as YamlMap;
const steps = firstJob.mappings.find((it) => it.key.value === "steps")
  ?.value as YAMLSequence; // stepsは必ず存在するので確定でYAMLSequence;
steps.items.forEach((it) => {
  console.log(
    // 1つのstepの中身はMapなのでmappingsで見る必要がある。[0]で適当に最初にkeyをここでは表示させてるだけ
    `${it.mappings[0].key.value}:`,
    src.indexToPosition(it.startPosition),
  );
  // 各stepの先頭の行番号を表示する
  console.log(src.rangeToLocation([it.startPosition, it.endPosition]));
});
