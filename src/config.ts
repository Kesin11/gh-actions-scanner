import { existsSync } from "https://deno.land/std@0.224.0/fs/exists.ts";
import { err, ok, Result } from "npm:neverthrow@6.2.2";
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
      try {
        const absConfigPath = await Deno.realPath(DEFAULT_USER_CONFIG_FILE);
        console.debug(`Try loading ${absConfigPath} config.`);
        const config: ConfigFile = await import(absConfigPath);

        return ok(config.default);
      } catch (error) {
        return err(
          new Error(`Failed to load ${DEFAULT_USER_CONFIG_FILE}.`, {
            cause: error,
          }),
        );
      }
    }

    // Load included default config.
    console.debug(`Load included default config.`);
    const config = await import("./config_default.ts");

    return ok(config.default);
  }

  // case: set --config option
  try {
    const absConfigPath = await Deno.realPath(configPath);
    console.debug(`Try loading ${absConfigPath} config.`);
    const config: ConfigFile = await import(absConfigPath);

    return ok(config.default);
  } catch (error) {
    return err(new Error(`Failed to load ${configPath}.`, { cause: error }));
  }
}
