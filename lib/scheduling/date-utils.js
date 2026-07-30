/**
 * Weekday names
 */
export const WEEK_DAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

/**
 * HH:mm -> Minutes
 *
 * Example
 * 09:30 -> 570
 */
export function timeToMinutes(time) {
  if (!time) return 0;

  const [hour, minute] = time.split(":").map(Number);

  return hour * 60 + minute;
}

/**
 * Minutes -> HH:mm
 *
 * Example
 * 570 -> 09:30
 */
export function minutesToTime(minutes) {
  const hour = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");

  const minute = (minutes % 60).toString().padStart(2, "0");

  return `${hour}:${minute}`;
}

/**
 * HH:mm
 *
 * ->
 *
 * 09:30 AM
 */
export function formatDisplayTime(time) {
  if (!time) return "";

  const [hour, minute] = time.split(":").map(Number);

  const date = new Date();

  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

/**
 * Date
 *
 * ->
 *
 * MONDAY
 */
export function getWeekDay(date) {
  return WEEK_DAYS[new Date(date).getDay()];
}

/**
 * Remove time portion
 */
export function normalizeDate(value) {
  if (!value) {
    throw new Error("Date value is required.");
  }

  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
}

/**
 * Appointment DateTime
 *
 * ->
 *
 * HH:mm
 */
export function getAppointmentTime(
  date,
  timezone = "Asia/Kolkata",
) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  });
}

/**
 * Checks overlap
 */
export function overlaps(slotStart, slotEnd, breakStart, breakEnd) {
  return slotStart < breakEnd && slotEnd > breakStart;
}


/**
 * Returns current time in IST.
 */
export function getCurrentISTDate() {
  return new Date();
}

/**
 * Compare only the date (ignores time).
 */
export function isSameDate(date1, date2) {
  return normalizeDate(date1).getTime() === normalizeDate(date2).getTime();
}

/**
 * Returns true if date1 is before date2 (date-only comparison).
 */
export function isBeforeDate(date1, date2) {
  return normalizeDate(date1) < normalizeDate(date2);
}

/**
 * Returns true if date1 is after date2 (date-only comparison).
 */
export function isAfterDate(date1, date2) {
  return normalizeDate(date1) > normalizeDate(date2);
}