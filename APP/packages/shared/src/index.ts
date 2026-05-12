// Shared zod schemas and types used across web, worker, and packages.

import { z } from 'zod';

// --- BullMQ job contract ---
// Single queue, job-name routing. Both web (producer) and worker (consumer)
// must import these constants — never hard-code the strings.
export const QUEUE_NAME = 'realestate';

export const JobName = {
  POLL_ICAL: 'poll-ical',
} as const;
export type JobName = (typeof JobName)[keyof typeof JobName];

export const PollIcalJobSchema = z.object({
  sourceId: z.string().min(1),
});
export type PollIcalJob = z.infer<typeof PollIcalJobSchema>;

// --- Property ---
export const PropertyCreateSchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  ownerName: z.string().optional(),
  ownerContact: z.string().optional(),
  notes: z.string().optional(),
});
export type PropertyCreateInput = z.infer<typeof PropertyCreateSchema>;

// --- iCal source ---
export const ICalLabelEnum = z.enum(['AIRBNB', 'BOOKING', 'VRBO', 'INTERHOME', 'OTHER']);
export type ICalLabel = z.infer<typeof ICalLabelEnum>;

export const ICalSourceCreateSchema = z.object({
  propertyId: z.string().min(1),
  label: ICalLabelEnum,
  url: z.string().url(),
});

// --- Check-in form ---
export const CheckInFormSchema = z.object({
  fullName: z.string().min(1),
  country: z.string().min(1),
  citizenId: z.string().min(1),
  dob: z.coerce.date(),
});
export type CheckInFormInput = z.infer<typeof CheckInFormSchema>;

// --- AI task outputs (validated at the boundary) ---
export const OverlapResolutionSchema = z.object({
  action: z.enum(['SUPPRESS', 'KEEP_BOTH', 'NEEDS_HUMAN']),
  targetReservationId: z.string().optional(),
  rationale: z.string().min(1).max(500),
});
export type OverlapResolution = z.infer<typeof OverlapResolutionSchema>;

export const ShoppingParseSchema = z.object({
  propertyId: z.string().nullable(),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        qty: z.number().int().positive(),
      }),
    )
    .min(0),
});
export type ShoppingParse = z.infer<typeof ShoppingParseSchema>;
