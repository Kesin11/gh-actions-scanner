import { existsSync } from "https://deno.land/std@0.224.0/fs/exists.ts";
import type { Config } from "./rules/types.ts";

type ConfigFile = {
  default: Config;
};

const DEFAULT_USER_CONFIG_FILE = "actions-scanner.config.ts";

// TODO: importがエラーになる可能性はあり得る。将来的にはResult型で返したい
export async function loadConfig(
  configPath: string | undefined,
): Promise<Config> {
  // case: no set --config option
  if (configPath === undefined) {
    // Load actions-scanner.config.ts if exists.
    if (existsSync(DEFAULT_USER_CONFIG_FILE)) {
      const absConfigPath = await Deno.realPath(DEFAULT_USER_CONFIG_FILE);
      console.debug(`Try loading ${absConfigPath} config.`);
      const config: ConfigFile = await import(absConfigPath);

      return config.default;
    }

    // Load included default config.
    console.debug(`Load included default config.`);
    const config = await import("./config_default.ts");

    return config.default;
  }

  // case: set --config option
  const absConfigPath = await Deno.realPath(configPath);
  const config: ConfigFile = await import(absConfigPath);
  console.debug(`Try loading ${absConfigPath} config.`);

  return config.default;
}
