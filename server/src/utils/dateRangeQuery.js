/** YYYY-MM-DD from <input type="date"> — treat as full calendar day in Vietnam (Asia/Ho_Chi_Minh, +07:00). */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const VN_DAY_OFFSET = "+07:00";

/**
 * @param {unknown} fromStr
 * @param {unknown} toStr
 * @returns {{ from: Date | null, to: Date | null }}
 */
export function parseOptionalDayBounds(fromStr, toStr) {
  let from = null;
  let to = null;
  const fs = fromStr != null && String(fromStr).trim() ? String(fromStr).trim() : "";
  const ts = toStr != null && String(toStr).trim() ? String(toStr).trim() : "";

  if (fs) {
    if (DATE_ONLY.test(fs)) {
      const d = new Date(`${fs}T00:00:00${VN_DAY_OFFSET}`);
      if (!Number.isNaN(d.getTime())) from = d;
    } else {
      const d = new Date(fs);
      if (!Number.isNaN(d.getTime())) from = d;
    }
  }
  if (ts) {
    if (DATE_ONLY.test(ts)) {
      const d = new Date(`${ts}T23:59:59.999${VN_DAY_OFFSET}`);
      if (!Number.isNaN(d.getTime())) to = d;
    } else {
      const d = new Date(ts);
      if (!Number.isNaN(d.getTime())) to = d;
    }
  }
  return { from, to };
}

/**
 * Coerce a raw [from, to] instant range to full calendar days in tz (same bounds as GET /expenses?from&to=YYYY-MM-DD).
 * @param {Date} fromInst
 * @param {Date} toInst
 * @param {string} [tz]
 * @returns {{ from: Date, to: Date, fromDay: string, toDay: string }}
 */
export function snapReportRangeToVnCalendar(fromInst, toInst, tz = "Asia/Ho_Chi_Minh") {
  let y1 = fromInst.toLocaleDateString("en-CA", { timeZone: tz });
  let y2 = toInst.toLocaleDateString("en-CA", { timeZone: tz });
  if (y1 > y2) [y1, y2] = [y2, y1];
  const { from, to } = parseOptionalDayBounds(y1, y2);
  if (!from || !to) {
    throw new Error("snapReportRangeToVnCalendar: invalid range");
  }
  return { from, to, fromDay: y1, toDay: y2 };
}
