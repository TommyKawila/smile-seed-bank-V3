/** Shared presets for executive dashboard + export (must match stats API). */
export function dashboardRangeBounds(preset: string): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  if (preset === "7") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (preset === "30") {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end };
}
