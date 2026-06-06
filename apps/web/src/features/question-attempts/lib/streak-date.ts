const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'] as const;

export function toKstDateString(date: Date) {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function getCurrentWeek() {
  const now = new Date();
  const today = toKstDateString(now);
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  const mondayOffset = (kstNow.getUTCDay() + 6) % 7;
  const monday = addDays(kstNow, -mondayOffset);
  const week = WEEKDAY_LABELS.map((label, index) => {
    const date = addDays(monday, index);
    return { label, date: toKstDateString(date) };
  });

  return {
    today,
    from: week[0].date,
    to: week[6].date,
    week,
  };
}

export function getCurrentWeekRange() {
  const { from, to } = getCurrentWeek();
  return { from, to };
}

export function getRecentStreakRange(days = 90) {
  const today = toKstDateString(new Date());
  const from = toKstDateString(addDays(new Date(), -(days - 1)));
  return { from, to: today };
}

export function toAttemptDate(gradedAt: string) {
  return toKstDateString(new Date(gradedAt));
}

export function getCurrentMonthString() {
  return toKstDateString(new Date()).slice(0, 7);
}

export function normalizeMonth(month?: string) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return getCurrentMonthString();
  return month;
}

export function getMonthRange(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const from = `${month}-01`;
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const to = `${month}-${String(lastDay).padStart(2, '0')}`;

  return { from, to };
}
