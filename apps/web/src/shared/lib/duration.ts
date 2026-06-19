export type HourMinuteDuration = {
  hours: number;
  minutes: number;
};

export function toHourMinuteDuration(milliseconds: number): HourMinuteDuration {
  const totalMinutes = Math.floor(milliseconds / 60_000);

  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}
