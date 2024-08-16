import { existsSync } from "https://deno.land/std@0.224.0/fs/exists.ts";
import { fromPromise, type Result } from "npm:neverthrow@7.0.1";
import type { Config } from "./rules/types.ts";

type ConfigFile = {
  default: Config;
};

const DEFAULT_USER_CONFIG_FILE = "actions-scanner.config.ts";

export async function loadConfig(
  configPath: string | undefined,
): Promise<Result<Config, Error>> {
  // case: no set --config option
  if (configPath === undefined) {
    // Load actions-scanner.config.ts if exists.
    if (existsSync(DEFAULT_USER_CONFIG_FILE)) {
      return await fromPromise(
        Deno.realPath(DEFAULT_USER_CONFIG_FILE),
        (e) => e as Error,
      )
        .andThen((absConfigPath) => {
          console.debug(`Try loading ${absConfigPath} config.`);
          const config: Promise<ConfigFile> = import(absConfigPath);
          return fromPromise(config, (e) => e as Error);
        })
        .map((config) => config.default);
    }

    // Load included default config.
    console.debug(`Load included default config.`);
    return await fromPromise(import("./config_default.ts"), (e) => e as Error)
      .map((config) => config.default);
  }

  // case: set --config option
  return await fromPromise(Deno.realPath(configPath), (e) => e as Error)
    .andThen((absConfigPath) => {
      console.debug(`Try loading ${absConfigPath} config.`);
      const config: Promise<ConfigFile> = import(absConfigPath);
      return fromPromise(config, (e) => e as Error);
    })
    .map((config) => config.default)
    .mapErr((error) =>
      new Error(`Failed to load ${configPath}.`, { cause: error })
    );
}
