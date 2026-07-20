import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { fillForm } from "./fill-form.js";
import { mergeSubmission } from "./schema.js";
import {
  assertStartPlayingUrl,
  eventFromStartPlayingUrl,
} from "./startplaying.js";

function usage(exitCode = 1): never {
  console.error(`Usage:
  npm run submit -- [--defaults path/to/defaults.yaml] <event.yaml>
  npm run submit -- [--defaults path/to/defaults.yaml] --from-url <startplaying-url> [--min-days N]

Example:
  npm run submit -- examples/sample-event.yaml
  npm run submit -- --from-url https://startplaying.games/adventure/<slug>
  npm run submit -- --defaults config/defaults.yaml events/my-game.yaml`);
  process.exit(exitCode);
}

function readYamlFile(filePath: string): unknown {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`File not found: ${abs}`);
  }
  return parseYaml(fs.readFileSync(abs, "utf8"));
}

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function parseArgs(argv: string[]): {
  defaultsPath: string;
  eventPath: string | null;
  fromUrl: string | null;
  minDaysAhead: number;
} {
  const args = [...argv];
  let defaultsPath = path.join("config", "defaults.yaml");
  let fromUrl: string | null = null;
  let minDaysAhead = 7;
  const positionals: string[] = [];

  while (args.length) {
    const a = args.shift()!;
    if (a === "--") {
      continue;
    }
    if (a === "--defaults") {
      const next = args.shift();
      if (!next) usage();
      defaultsPath = next;
    } else if (a === "--from-url") {
      const next = args.shift();
      if (!next) usage();
      fromUrl = next;
    } else if (a === "--min-days") {
      const next = args.shift();
      if (!next) usage();
      const parsed = Number(next);
      if (!Number.isFinite(parsed) || parsed < 0) {
        console.error("--min-days must be a non-negative number");
        usage();
      }
      minDaysAhead = parsed;
    } else if (a === "--help" || a === "-h") {
      usage(0);
    } else if (a.startsWith("-")) {
      console.error(`Unknown flag: ${a}`);
      usage();
    } else {
      positionals.push(a);
    }
  }

  if (fromUrl && positionals.length) {
    console.error("Pass either --from-url or an event YAML path, not both.");
    usage();
  }

  if (!fromUrl && positionals.length === 1 && looksLikeUrl(positionals[0]!)) {
    fromUrl = positionals[0]!;
  }

  if (!fromUrl && positionals.length !== 1) usage();
  if (fromUrl) {
    assertStartPlayingUrl(fromUrl);
  }

  return {
    defaultsPath,
    eventPath: fromUrl ? null : positionals[0]!,
    fromUrl,
    minDaysAhead,
  };
}

async function main(): Promise<void> {
  const { defaultsPath, eventPath, fromUrl, minDaysAhead } = parseArgs(
    process.argv.slice(2),
  );

  if (!fs.existsSync(path.resolve(defaultsPath))) {
    console.error(
      `Defaults not found: ${path.resolve(defaultsPath)}\n` +
        `Copy config/defaults.example.yaml to config/defaults.yaml and edit it.`,
    );
    process.exit(1);
  }

  let data;
  try {
    const defaults = readYamlFile(defaultsPath);
    const event = fromUrl
      ? await eventFromStartPlayingUrl(fromUrl, { minDaysAhead })
      : readYamlFile(eventPath!);
    if (fromUrl) {
      console.log(
        `Imported event from StartPlaying (min ${minDaysAhead} day(s) ahead):`,
      );
      console.log(JSON.stringify(event, null, 2));
    }
    data = mergeSubmission(defaults, event);
  } catch (err) {
    console.error("Validation failed:");
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const profileDir = path.resolve(".browser-profile");
  await fillForm({ data, profileDir });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
