// SQLite's datetime('now') / CURRENT_TIMESTAMP return naive UTC
// ("YYYY-MM-DD HH:MM:SS", no zone), which JS's Date parses as LOCAL time —
// silently shifting every such timestamp by the server's UTC offset. Seed
// data and JS-computed fields (endsAt, startAt) already use
// new Date(...).toISOString(), which always ends in 'Z' and passes through
// unchanged here.
export function toIsoUtc(value: string): string {
  if (!value) return value;
  if (value.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(value)) return value;
  return value.replace(' ', 'T') + 'Z';
}
