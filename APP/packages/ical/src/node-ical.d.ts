// Minimal local typings for `node-ical`.
// We only use `sync.parseICS`, so we model just the surface we touch.
// `node-ical`'s own typings are loose; this keeps strict mode honest without `any`.

declare module 'node-ical' {
  export type VEvent = {
    type: 'VEVENT';
    uid?: string;
    summary?: string;
    start?: Date;
    end?: Date;
  };

  export type CalendarComponent =
    | VEvent
    | { type: string; [key: string]: unknown };

  export type ParsedCalendar = Record<string, CalendarComponent>;

  export const sync: {
    parseICS(input: string): ParsedCalendar;
  };
}
