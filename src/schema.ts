import { z } from "zod";

export const FORMATS = [
  "In person",
  "Online: Foundry VTT",
  "Online: Roll20",
  "Online: Alchemy RPG",
  "Online Chat or Video Only (Discord/Zoom)",
  "Content Creator",
] as const;

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRe = /^\d{4}-\d{2}-\d{2}$/;

export const defaultsSchema = z.object({
  email: z.email(),
  harbourmasterName: z.string().min(1),
  publicContact: z.string().min(1),
  timezone: z.string().min(1).optional(),
  signedUpForHarbourmasters: z.literal(true).default(true),
});

export const eventSchema = z.object({
  eventName: z.string().min(1),
  nameOfEvent: z.string().min(1),
  cityState: z.string().min(1),
  format: z.enum(FORMATS),
  maxPlayers: z.union([z.string().min(1), z.number().int().positive()]),
  addressOrLink: z.string().min(1),
  date: z.string().regex(dateRe, "date must be YYYY-MM-DD"),
  startTime: z.string().regex(timeRe, "startTime must be HH:MM (24h)"),
  endTime: z
    .string()
    .regex(timeRe, "endTime must be HH:MM (24h)")
    .optional(),
  timezone: z.string().min(1).optional(),
  description: z.string().min(1),
  notes: z.string().optional(),
});

export const submissionSchema = defaultsSchema
  .merge(eventSchema)
  .refine((data) => Boolean(data.timezone), {
    message: "timezone is required (set it in defaults.yaml or the event file)",
    path: ["timezone"],
  });

export type Defaults = z.infer<typeof defaultsSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type Submission = z.infer<typeof submissionSchema>;

export function mergeSubmission(
  defaults: unknown,
  event: unknown,
): Submission {
  const d = defaultsSchema.parse(defaults);
  const e = eventSchema.parse(event);
  return submissionSchema.parse({ ...d, ...e });
}
