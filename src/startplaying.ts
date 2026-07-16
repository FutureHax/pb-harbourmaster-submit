import { FORMATS, type EventInput } from "./schema.js";

const STARTPLAYING_HOST = "startplaying.games";

type Cache = Record<string, Record<string, unknown>>;

function refId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const ref = (value as { __ref?: unknown }).__ref;
  return typeof ref === "string" ? ref : null;
}

function resolveRef(cache: Cache, value: unknown): Record<string, unknown> | null {
  const id = refId(value);
  if (!id) return null;
  return cache[id] ?? null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseNextData(html: string): unknown {
  const match = html.match(
    /<script id="__NEXT_DATA__"[^>]*>(?<json>[\s\S]*?)<\/script>/,
  );
  if (!match?.groups?.json) {
    throw new Error("StartPlaying page did not include __NEXT_DATA__");
  }
  return JSON.parse(match.groups.json);
}

function getCache(nextData: unknown): Cache {
  const cache = (nextData as {
    props?: { pageProps?: { initialCache?: Cache } };
  })?.props?.pageProps?.initialCache;
  if (!cache || typeof cache !== "object") {
    throw new Error("StartPlaying page cache missing");
  }
  return cache;
}

function adventureSlugFromUrl(url: URL): string {
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("adventure");
  if (idx < 0 || !parts[idx + 1]) {
    throw new Error(
      "URL must look like https://startplaying.games/adventure/<slug>",
    );
  }
  return parts[idx + 1]!;
}

function findAdventure(cache: Cache, slug: string): Record<string, unknown> {
  const adventures = Object.values(cache).filter(
    (item) => item?.__typename === "Adventure",
  );
  const match =
    adventures.find((item) => item.slug === slug) ?? adventures[0];
  if (!match) {
    throw new Error(`No Adventure found for slug ${slug}`);
  }
  return match;
}

function mapFormat(platformName: string | null): (typeof FORMATS)[number] {
  const name = (platformName ?? "").toLowerCase();
  if (name.includes("foundry")) return "Online: Foundry VTT";
  if (name.includes("roll20")) return "Online: Roll20";
  if (name.includes("alchemy")) return "Online: Alchemy RPG";
  if (name.includes("discord") || name.includes("zoom")) {
    return "Online Chat or Video Only (Discord/Zoom)";
  }
  if (name.includes("twitch") || name.includes("youtube")) {
    return "Content Creator";
  }
  // StartPlaying listings are online by default.
  return "Online: Foundry VTT";
}

function partsInTimeZone(
  iso: string,
  timeZone: string,
): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid datetime: ${iso}`);
  }
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(d).map((p) => [p.type, p.value]),
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
  return { date, time };
}

function buildDescription(options: {
  introduction: string | null;
  gameHook: string | null;
  experienceLevel: string | null;
  ageRange: string | null;
  seatsLeft: number | null;
  maxPlayers: number;
  costPerPlayer: number | null;
  hostName: string | null;
  platformName: string | null;
}): string {
  const bits: string[] = [];
  if (options.introduction) bits.push(options.introduction.trim());
  if (options.gameHook) bits.push(options.gameHook.trim());

  const meta: string[] = [];
  meta.push("Public StartPlaying listing.");
  if (options.platformName) meta.push(`Platform: ${options.platformName}.`);
  if (options.experienceLevel) meta.push(`Experience: ${options.experienceLevel}.`);
  if (options.ageRange === "EIGHTEEN_PLUS") meta.push("Ages 18+.");
  if (options.costPerPlayer === 0) meta.push("Free to join.");
  if (options.seatsLeft != null) {
    meta.push(`${options.seatsLeft} seat(s) left of ${options.maxPlayers}.`);
  }
  if (options.hostName) meta.push(`GM: ${options.hostName}.`);
  bits.push(meta.join(" "));
  return bits.join("\n\n");
}

export function assertStartPlayingUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Invalid URL: ${raw}`);
  }
  if (!url.hostname.endsWith(STARTPLAYING_HOST)) {
    throw new Error(
      `Only ${STARTPLAYING_HOST} adventure URLs are supported (got ${url.hostname})`,
    );
  }
  return url;
}

export async function eventFromStartPlayingUrl(
  rawUrl: string,
): Promise<EventInput> {
  const url = assertStartPlayingUrl(rawUrl);
  const slug = adventureSlugFromUrl(url);

  const response = await fetch(url.toString(), {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; pb-harbourmaster-submit/1.0; +local)",
      accept: "text/html",
    },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch StartPlaying listing: HTTP ${response.status}`,
    );
  }
  const html = await response.text();
  const nextData = parseNextData(html);
  const cache = getCache(nextData);
  const adventure = findAdventure(cache, slug);

  const title = asString(adventure.title);
  if (!title) throw new Error("Adventure is missing title");

  const maxPlayers = asNumber(adventure.maxPlayers);
  if (!maxPlayers || maxPlayers < 1) {
    throw new Error("Adventure is missing maxPlayers");
  }

  const timeZone =
    asString(adventure.timezone) ?? "America/New_York";

  const template = resolveRef(cache, adventure.gameTemplate);
  const host = resolveRef(cache, adventure.host);
  const nextSession = resolveRef(cache, adventure.nextSession);

  const platformRef = Array.isArray(template?.platforms)
    ? template.platforms[0]
    : null;
  const platform = resolveRef(cache, platformRef);
  const platformName = asString(platform?.name);

  const startIso =
    asString(nextSession?.startTime) ??
    asString(adventure.scheduledDate);
  if (!startIso) {
    throw new Error("Adventure has no upcoming session start time");
  }
  const endIso = asString(nextSession?.endTime);

  const start = partsInTimeZone(startIso, timeZone);
  const end = endIso ? partsInTimeZone(endIso, timeZone) : null;

  const format = mapFormat(platformName);
  const cityState = platformName
    ? `${platformName} / StartPlaying.games`
    : "StartPlaying.games";

  const description = buildDescription({
    introduction: asString(template?.introduction),
    gameHook: asString(template?.gameHook),
    experienceLevel: asString(template?.experienceLevel),
    ageRange: asString(template?.ageRange),
    seatsLeft: asNumber(adventure.seatsLeft),
    maxPlayers,
    costPerPlayer: asNumber(adventure.costPerPlayer),
    hostName: asString(host?.name),
    platformName,
  });

  const event: EventInput = {
    eventName: platformName ? `${title} (${platformName})` : title,
    nameOfEvent: `${title} @ StartPlaying`,
    cityState,
    format,
    maxPlayers,
    addressOrLink: url.toString(),
    date: start.date,
    startTime: start.time,
    timezone: timeZone,
    description,
    notes: `Imported from ${url.toString()}`,
  };
  if (end) {
    event.endTime = end.time;
  }
  return event;
}
