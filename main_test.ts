import { assertEquals } from "https://deno.land/std@0.205.0/assert/mod.ts";
import { reduceGroups } from "https://deno.land/std@0.212.0/collections/reduce_groups.ts";

const sumBy = (records: Record<string, unknown[]>, key: string) => {
  return reduceGroups(records, (sum, it: any) => sum + it[key], 0);
};

// 実験のために書いたコードなので消してよい
Deno.test("sumBy", () => {
  const billable = [
    { runner: "UBUNTU", duration_ms: 100 },
    { runner: "UBUNTU", duration_ms: 200 },
    { runner: "WINDOWS", duration_ms: 100 },
  ];
  const billableGroup = Object.groupBy(billable, (x) => x.runner);
  assertEquals(sumBy(billableGroup, "duration_ms"), {
    "UBUNTU": 300,
    "WINDOWS": 100,
  });
});
