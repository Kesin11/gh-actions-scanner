import { assertEquals } from "@std/assert";
import type { WorkflowRunUsage } from "@kesin11/gha-utils";
import {
  createJobsBillableById,
  createJobsBillableStat,
  JobsBillableById,
} from "./workflow_summariser.ts";

Deno.test(createJobsBillableById.name, () => {
  const workflowRunUsage: WorkflowRunUsage = {
    billable: {
      "UBUNTU": {
        total_ms: 100,
        jobs: 1,
        job_runs: [
          { job_id: 20474751294, duration_ms: 100 },
        ],
      },
      "WINDOWS": {
        total_ms: 100,
        jobs: 1,
        job_runs: [
          { job_id: 20474751396, duration_ms: 100 },
        ],
      },
    },
  };
  assertEquals(createJobsBillableById([workflowRunUsage]), {
    "20474751294": { // job_id
      "runner": "UBUNTU",
      "duration_ms": 100,
    },
    "20474751396": {
      "runner": "WINDOWS",
      "duration_ms": 100,
    },
  });
});

Deno.test(createJobsBillableStat.name, () => {
  const jobsBillableById: JobsBillableById = {
    "20474751294": { // job_id
      "runner": "UBUNTU",
      "duration_ms": 60000,
    },
    "20474751396": {
      "runner": "UBUNTU",
      "duration_ms": 90000,
    },
  };
  const jobIds = [20474751294, 20474751396];

  assertEquals(createJobsBillableStat(jobsBillableById, jobIds), {
    "UBUNTU": {
      min: 60,
      median: 75,
      p80: 90,
      p90: 90,
      max: 90,
    },
  });
});
