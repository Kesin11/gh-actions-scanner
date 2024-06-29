# gh-actions-scanner

`gh-actions-scanner` is a tool for scanning the GitHub repository for GitHub Actions. It's not a linter, but a scanner that provides insight into the performance and usage of GitHub Actions performance.

`gh-actions-scanner` is also a framework that allows you to run custom rules that extend the capabilities of the scanner.

## Still under development :warning:
`gh-actions-scanner` is still under development. The API and CLI options may change in the future untill stable version 1.x released.

## USAGE

```bash
deno run -A main.ts --token=$(gh auth token) -R ORG/REPO
# OR
export GITHUB_TOKEN=$(gh auth token)
deno run -A main.ts -R ORG/REPO
```

## Sample output
```bash
$ deno run -A main.ts -R moby/buildkit --created ">=2024-06-25"
Load included default config.
owner: moby, repo: buildkit, created: >=2024-06-25
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
 MEDIUM: Cache size will soon reach its MAX limit                                                                                                                                                                                                                                       
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 Cache size will soon reach its MAX limit. It's using 25GB / 10GB                                                                                                                                                                                                                       
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 Recommend to reduce cache size.                                                                                                                                                                                                                                                        
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
 LOW: List Top 10 cache size                                                                                                                                                                                                                                                            
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 refs/heads/master: key: macOS-vagrant-2b789e7037e84f507a8fccbdb2617df465d212f9265c304ac2e666869230689f, size: 966 MB                                                                                                                                                                   
 refs/pull/5080/merge: key: macOS-vagrant-2b789e7037e84f507a8fccbdb2617df465d212f9265c304ac2e666869230689f, size: 966 MB                                                                                                                                                                
 refs/heads/master: key: buildkit-blob-1-sha256:d7f852fbf8fc5832626d20efbf42bc785836b41707f4e585a42e89c8824968fd, size: 154 MB                                                                                                                                                          
 refs/heads/master: key: buildkit-blob-1-sha256:c21523feba947af226095428e06a1145dc44b0c9595fa7b3ac74b54f2cf83110, size: 154 MB                                                                                                                                                          
 refs/pull/5084/merge: key: buildkit-blob-1-sha256:bf63d56192d4249b2a7e6df5d7788dc7027c09f039bfbe76591c0037f6957f37, size: 77 MB                                                                                                                                                        
 refs/pull/5084/merge: key: buildkit-blob-1-sha256:a500a8321876865f9fdde6a62276dc5d11a445bcaf9e32f56d7b5d4adf1546fd, size: 77 MB                                                                                                                                                        
 refs/heads/master: key: buildkit-blob-1-sha256:158ea1db3d60cd2344542f4c754f11f7b6c492207b9904e49fd195446cbdcffe, size: 77 MB                                                                                                                                                           
 refs/heads/master: key: buildkit-blob-1-sha256:e170d403caed9bb985cb5329f1ca517abd72f79fe85f7179aad9549da58bb017, size: 77 MB                                                                                                                                                           
 refs/heads/master: key: buildkit-blob-1-sha256:e82a4d4438ab12fb773222f0050bc05c53dcfe93d97acf465f5fa34acb6d13cc, size: 77 MB                                                                                                                                                           
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
 LOW: Count of workflow runs                                                                                                                                                                                                                                                            
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 test-os: 8 runs                                                                                                                                                                                                                                                                        
 buildkit: 8 runs                                                                                                                                                                                                                                                                       
 validate: 7 runs                                                                                                                                                                                                                                                                       
 frontend: 7 runs                                                                                                                                                                                                                                                                       
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
 LOW: Count of each retried workflow runs                                                                                                                                                                                                                                               
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 buildkit: 3/8 runs are retried.                                                                                                                                                                                                                                                        
 test-os: 1/8 runs are retried.                                                                                                                                                                                                                                                         
 validate: 1/7 runs are retried.                                                                                                                                                                                                                                                        
 frontend: 1/7 runs are retried.                                                                                                                                                                                                                                                        
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
 LOW: Sum usage time for each workflow                                                                                                                                                                                                                                                  
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 buildkit: 8772 sec                                                                                                                                                                                                                                                                     
 test-os: 8613 sec                                                                                                                                                                                                                                                                      
 validate: 8034 sec                                                                                                                                                                                                                                                                     
 frontend: 5190 sec                                                                                                                                                                                                                                                                     
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

Total: 5 (HIGH: 0, MEDIUM: 1, LOW: 4, UNKNOWN: 0)
```

## Options

```bash
$ deno run -A main.ts --help

Usage: actions-scanner --repo <repo_fullname>

Description:

  Scan GitHub Actions workflows and report performance issues.

Options:

  -h, --help                                          - Show this help.                                                                                                                         
  -t, --token               <token>                   - GitHub token. ex: $(gh auth token)                                                                                                      
  -R, --repo                <repo_fullname>           - Fullname of repository. OWNER/REPO format                                      (required)                                               
  --created                 <created>                 - Returns workflow runs created within the given date-time range. ex:                                                                     
                                                        >=YYYY-MM-DD, YYYY-MM-DD..YYYY-MM-DD. If omit this option, it created by                                                                
                                                        range of recent runs date. For more information on the syntax, see                                                                      
                                                        https://docs.github.com/search-github/getting-started-with-searching-on-githu                                                           
                                                        b/understanding-the-search-syntax#query-for-dates                                                                                       
  --host                    <host>                    - GitHub host. Specify your GHES host If you will use it on GHES                                                                          
  --config                  <config>                  - config file path. Default: actions-scanner.config.ts . If                                                                               
                                                        actions-scanner.config.ts is not found, use included default config.                                                                    
  -f, --format              <name>                    - Formatter name. Default: "table". Available: json,table                        (Default: "table", Values: "json", "table")              
  -s, --severity            <items>                   - Severities of filter result. Pass to camma separated string. Available:        (Default: [ "high", "medium", "low", "unknown" ], Values:
                                                        high,medium,low,unknown                                                        "high", "medium", "low", "unknown")                      
  --workflow-file-ref       <workflow_file_ref>       - Git ref for workflow files that will use showing url at result. Default:                                                                
                                                        Repository main branch                                                                                                                  
  --force-include-schedule  [force_include_schedule]  - Force schedule workflow jobs to be included in the scan. By default, if there  (Default: false)                                         
                                                        are too many schedule jobs, these are filtered.. Default: false                                                                         
  --debug                   [debug]                   - Enable debug log. Default: false                                               (Default: false)
```

## Support GHES
`gh-actions-scanner` can also work on GitHub Enterprise Server(GHES). It needs `--host` option and GitHub token for your GHES.

```bash
deno run -A main.ts -R ORG/REPO \
  --host YOUR_ENTERPRISE_HOST \
  --token $(gh auth token -h YOUR_ENTERPRISE_HOST)
```

## Config file

`gh-actions-scanner` is designed working well with no option. However if you want to customize the behavior of `gh-actions-scanner`, you can provide your configuration file. See [actions-scanner.config.sample.ts](./actions-scanner.config.sample.ts) for a sample configuration.

`gh-actions-scanner` loads `actions-scanner.config.ts` file from the current directory. If you want to use a specific file, you can use `--config` option.

The config is insipred by [ESLint flat config](https://eslint.org/docs/latest/use/configure/configuration-files), so you can choose which rules `gh-actions-scanner` use to verify by JavaScript native import syntax. And thanks to [Deno import feature](https://docs.deno.com/runtime/manual/basics/modules/), the config file allows you to import custom rules that are published on npm/jsr/GitHub or elsewhere.

```typescript
// If you import private repository, you need to set PAT.
// export DENO_AUTH_TOKENS=$(gh auth token)@raw.githubusercontent.com
// ref: https://docs.deno.com/runtime/manual/basics/modules/private

import { reportWorkflowUsage } from "https://raw.githubusercontent.com/your-private-org/gh-actions-scanner/main/src/rules/workflow_run_usage.ts";
import { RuleFunc } from "https://raw.githubusercontent.com/your-private-org/gh-actions-scanner/main/src/rules/types.ts";

type Config = {
  rules: RuleFunc[];
};

const config: Config = {
  rules: [
    reportWorkflowUsage,
  ],
};
export default config;
```

## Create Custom rule

To create a custom rule, implement a function that follows the `RuleFunc` interface defined in [src/rules/types.ts](./src/rules/types.ts), then push it to a repository or publish it to npm/jsr. You can then import your custom rule from the configuration file.

## Development

```bash
# Test
deno test -A --watch

# Run with debug log
deno run -A main.ts --token=$(gh auth token) -R ORG/REPO --debug
```

## Roadmap

- [ ] Add custom rule example code.
- [ ] Release as gh extensions.
- [ ] Release as single binary using Deno compile.
- [ ] Fix built-in rules output to more readable.
- [ ] Add help message to fix the issue that reported by built-in rules.
- [ ] Add more built-in rules.
- [ ] Support to output standard format like SARIF.
- [ ] Add cache feature using Deno KV.

## LICENSE

MIT
