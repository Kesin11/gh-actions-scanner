import { decodeBase64 } from "https://deno.land/std@0.212.0/encoding/base64.ts";
import { Octokit, RestEndpointMethodTypes } from "npm:@octokit/rest@20.0.2";

export type WorkflowRun =
  RestEndpointMethodTypes["actions"]["getWorkflowRunAttempt"]["response"][
    "data"
  ];
export type WorkflowJobs =
  RestEndpointMethodTypes["actions"]["listJobsForWorkflowRunAttempt"][
    "response"
  ][
    "data"
  ]["jobs"];

export type WorkflowRunUsage =
  RestEndpointMethodTypes["actions"]["getWorkflowRunUsage"]["response"]["data"];

export type ActionsCacheUsage =
  RestEndpointMethodTypes["actions"]["getActionsCacheUsage"]["response"][
    "data"
  ];
export type ActionsCacheList =
  RestEndpointMethodTypes["actions"]["getActionsCacheList"]["response"]["data"];

export type FileContentResponse = {
  type: "file";
  size: number;
  name: string;
  path: string;
  content: string;
  sha: string;
  url: string;
  git_url: string | null;
  html_url: string | null;
  download_url: string | null;
};

export class FileContent {
  raw: FileContentResponse;
  content: string;
  constructor(getContentResponse: FileContentResponse) {
    this.raw = getContentResponse;
    const textDecoder = new TextDecoder();
    this.content = textDecoder.decode(decodeBase64(getContentResponse.content));
  }
}

export class Github {
  octokit: Octokit;
  token?: string;
  baseUrl: string;
  isGHES: boolean;
  contentCache: Map<string, FileContent> = new Map();

  constructor(
    options?: { token?: string; host?: string },
  ) {
    this.baseUrl = Github.getBaseUrl(options?.host);
    this.isGHES = this.baseUrl !== "https://api.github.com";
    this.token = options?.token ?? Deno.env.get("GITHUB_TOKEN") ?? undefined,
      this.octokit = new Octokit({
        auth: this.token,
        baseUrl: this.baseUrl,
      });
  }

  private static getBaseUrl(host?: string): string {
    if (host) {
      return host.startsWith("https://")
        ? `${host}/api/v3`
        : `https://${host}/api/v3`;
    } else if (Deno.env.get("GITHUB_API_URL")) {
      return Deno.env.get("GITHUB_API_URL")!;
    } else {
      return "https://api.github.com";
    }
  }

  async fetchWorkflowRunUsages(
    workflowRuns: WorkflowRun[],
  ): Promise<WorkflowRunUsage[] | undefined> {
    // NOTE: GHES does not support this API
    if (this.isGHES) return undefined;

    const promises = workflowRuns.map((run) => {
      return this.octokit.actions.getWorkflowRunUsage({
        owner: run.repository.owner.login,
        repo: run.repository.name,
        run_id: run.id,
      });
    });
    return (await Promise.all(promises)).map((res) => res.data);
  }

  async fetchWorkflowJobs(
    workflowRuns: WorkflowRun[],
  ): Promise<WorkflowJobs> {
    const promises = workflowRuns.map((run) => {
      return this.octokit.actions.listJobsForWorkflowRunAttempt({
        owner: run.repository.owner.login,
        repo: run.repository.name,
        run_id: run.id,
        attempt_number: run.run_attempt ?? 1,
      });
    });
    const workflowJobs = (await Promise.all(promises)).map((res) =>
      res.data.jobs
    );
    return workflowJobs.flat();
  }

  async fetchWorkflowRuns(
    owner: string,
    repo: string,
    perPage: number,
  ): Promise<WorkflowRun[]> {
    const res = await this.octokit.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      per_page: perPage,
    });
    return res.data.workflow_runs;
  }

  async fetchActionsCacheUsage(
    owner: string,
    repo: string,
  ): Promise<ActionsCacheUsage> {
    const res = await this.octokit.actions.getActionsCacheUsage({
      owner,
      repo,
    });
    return res.data;
  }

  async fetchActionsCacheList(
    owner: string,
    repo: string,
    perPage: number,
  ): Promise<ActionsCacheList> {
    const res = await this.octokit.actions.getActionsCacheList({
      owner,
      repo,
      sort: "size_in_bytes",
      per_page: perPage,
    });
    return res.data;
  }

  async fetchWorkflowFiles(
    workflowRuns: WorkflowRun[],
  ): Promise<(FileContent | undefined)[]> {
    const promises = workflowRuns.map((workflowRun) => {
      return this.fetchContent({
        owner: workflowRun.repository.owner.login,
        repo: workflowRun.repository.name,
        path: workflowRun.path,
        ref: workflowRun.head_sha,
      });
    });
    // NOTE: fetchContentの側でawaitしてしまっているのでPromise.allで並列の効果があるかは怪しいかもしれない
    return await Promise.all(promises);
  }

  async fetchContent(params: {
    owner: string;
    repo: string;
    path: string;
    ref: string;
  }): Promise<(FileContent | undefined)> {
    // console.debug(`getContent: ${params.owner}/${params.repo}/${params.path}`);

    const cache = this.contentCache.get(JSON.stringify(params));
    if (cache) return cache;

    try {
      const res = await this.octokit.repos.getContent({
        owner: params.owner,
        repo: params.repo,
        path: params.path,
        ref: params.ref,
      });
      // https://github.com/octokit/types.ts/issues/440#issuecomment-1221055881
      if (!Array.isArray(res.data) && res.data.type === "file") {
        const fetchedFileContent = new FileContent(res.data);

        this.contentCache.set(JSON.stringify(params), fetchedFileContent);
        return fetchedFileContent;
      }
    } catch (_error) {
      console.debug(
        `fetchContent: ${params.owner}/${params.repo}/${params.path}`,
      );
    }
    // Unexpected response
    return undefined;
  }
}
