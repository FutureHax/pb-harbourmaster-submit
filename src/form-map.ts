export const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScZ_FBklDEU0nuob-shDTwuJ4gWjk1M9ChQTUyno63hQueJkA/viewform";

/** Google Form question / entry IDs from FB_PUBLIC_LOAD_DATA_ */
export const ENTRY = {
  email: "emailAddress",
  harbourmastersYes: "234573760",
  harbourmasterName: "665614296",
  publicContact: "866608474",
  eventName: "951501700",
  cityState: "1421328016",
  nameOfEvent: "1406921680",
  format: "2098222390",
  maxPlayers: "438316654",
  addressOrLink: "811824072",
  date: "137349249",
  startTime: "1165212097",
  endTime: "902722052",
  timezone: "1571661074",
  description: "1088196447",
  notes: "799188497",
} as const;

export const HARBOURMASTERS_YES_LABEL =
  "Yes (You must do this first before submitting an event. )";

/** Accessible names / label matchers used by Playwright getByRole / getByLabel */
export const LABELS = {
  email: /^(email|your email)$/i,
  harbourmasterName: /harbourmaster name/i,
  publicContact: /public contact information/i,
  eventName: /^event name/i,
  cityState: /city\s*&\s*state/i,
  nameOfEvent: /name of event/i,
  format: /in person, online, or content creator/i,
  maxPlayers: /max number of players/i,
  addressOrLink: /physical address/i,
  date: /date of event/i,
  startTime: /start time/i,
  endTime: /end time/i,
  timezone: /what time zone/i,
  description: /description of game/i,
  notes: /any additional/i,
  harbourmastersProgram: /harbourmasters program/i,
} as const;
