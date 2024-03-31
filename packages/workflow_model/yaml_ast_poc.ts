import { safeLoad, YamlMap } from "npm:yaml-ast-parser@0.0.43";
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
