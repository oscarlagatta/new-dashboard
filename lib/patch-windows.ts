// Rolling patch-window generator.
//
// Produces 3 consecutive weekends' worth of slot strings starting from the
// upcoming Friday (or today, if today is Friday). Per weekend:
//   Friday   16:00–23:59 ET           (1 slot — afternoon cutover)
//   Saturday 00:00–08:00 / 08:00–16:00 / 16:00–23:59 ET   (3 slots)
//   Sunday   00:00–08:00 / 08:00–16:00 / 16:00–23:59 ET   (3 slots)
//   Monday   00:00–08:00 ET           (1 slot — recovery window)
//
// Format example: "Fri 5/15 16:00–23:59 ET" (M/D, no zero padding).
//
// Pure function — no Math.random(), no module-level mutable state. Accepts an
// optional reference date so tests can pin "now".

const DAY_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type DaySlots = { day: 5 | 6 | 0 | 1; offset: number; slots: string[] };

const WEEKEND_TEMPLATE: DaySlots[] = [
  { day: 5, offset: 0, slots: ["16:00–23:59 ET"] }, // Fri
  {
    day: 6,
    offset: 1,
    slots: ["00:00–08:00 ET", "08:00–16:00 ET", "16:00–23:59 ET"],
  }, // Sat
  {
    day: 0,
    offset: 2,
    slots: ["00:00–08:00 ET", "08:00–16:00 ET", "16:00–23:59 ET"],
  }, // Sun
  { day: 1, offset: 3, slots: ["00:00–08:00 ET"] }, // Mon
];

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

/** Returns the next Friday on or after `from`. If `from` is a Friday, returns `from`. */
function nextFriday(from: Date): Date {
  const dow = from.getDay(); // 0=Sun … 5=Fri … 6=Sat
  const delta = (5 - dow + 7) % 7;
  return addDays(from, delta);
}

function formatDate(d: Date): string {
  return `${DAY_LABEL[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
}

export function getPatchWindows(now: Date = new Date()): string[] {
  // Strip the time component so day-of-week math stays correct around DST.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const firstFriday = nextFriday(today);

  const out: string[] = [];
  for (let week = 0; week < 3; week++) {
    const weekendFriday = addDays(firstFriday, week * 7);
    for (const entry of WEEKEND_TEMPLATE) {
      const date = addDays(weekendFriday, entry.offset);
      const datePrefix = formatDate(date);
      for (const slot of entry.slots) {
        out.push(`${datePrefix} ${slot}`);
      }
    }
  }
  return out;
}
