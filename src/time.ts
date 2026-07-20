export type FormTimePeriod = "AM" | "PM";

export type FormTimeParts = {
  hour12: number;
  minute: string;
  period: FormTimePeriod;
};

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
