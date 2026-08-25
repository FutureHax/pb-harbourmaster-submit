export type FormTimePeriod = "AM" | "PM";

export type FormTimeParts = {
  hour12: number;
  minute: string;
  period: FormTimePeriod;
};

/**
 * Short zone label for the form (EST, EDT, PST...). Resolved against the
 * session date so the form shows the abbreviation in effect that day.
 */
export function shortTimeZoneName(iso: string, timeZone: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid datetime: ${iso}`);
  }
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short",
  })
    .formatToParts(d)
    .find((p) => p.type === "timeZoneName")?.value;
  return name ?? timeZone;
}

/** Convert schema HH:MM (24h) into Google Forms 12h spinner parts. */
export function hhmmToFormParts(hhmm: string): FormTimeParts {
  const [hour24Str, minute] = hhmm.split(":");
  const hour24 = Number(hour24Str);
  if (
    !Number.isInteger(hour24) ||
    hour24 < 0 ||
    hour24 > 23 ||
    !minute ||
    !/^\d{2}$/.test(minute)
  ) {
    throw new Error(`Invalid HH:MM time: ${hhmm}`);
  }
  const period: FormTimePeriod = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, minute, period };
}
