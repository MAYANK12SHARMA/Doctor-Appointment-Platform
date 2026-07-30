import {
  timeToMinutes,
  minutesToTime,
  formatDisplayTime,
  overlaps,
  getAppointmentTime,
} from "./date-utils";

import { validateSlotGeneration } from "./validators";

/* -------------------------------------------------------------------------- */
/*                             Create Slot Object                             */
/* -------------------------------------------------------------------------- */

function createSlot(
  startMinutes,
  duration,
  appointmentDate,
  timezone,
) {
  const startTime = minutesToTime(startMinutes);

  const endTime = minutesToTime(
    startMinutes + duration,
  );

  return {
    appointmentDate: new Date(appointmentDate),

    timezone,

    startTime,

    endTime,

    displayStartTime:
      formatDisplayTime(startTime),

    displayEndTime:
      formatDisplayTime(endTime),

    duration,

    durationMinutes: duration,

    available: true,

    status: "AVAILABLE",

    reason: null,

    appointmentId: null,

    breakId: null,

    breakTitle: null,
  };
}

/* -------------------------------------------------------------------------- */
/*                        Generate Available Slots                            */
/* -------------------------------------------------------------------------- */

export function generateAvailableSlots({
  doctor,
  schedule,
  leave,
  appointments = [],
}) {
  validateSlotGeneration({
    doctor,
    schedule,
  });

  if (!schedule) {
    return {
      success: true,
      reason: "NO_SCHEDULE",
      totalSlots: 0,
      availableSlots: 0,
      slots: [],
    };
  }

  if (!schedule.isAvailable) {
    return {
      success: true,
      reason: "DOCTOR_UNAVAILABLE",
      totalSlots: 0,
      availableSlots: 0,
      slots: [],
    };
  }

  if (leave) {
    return {
      success: true,
      reason: "DOCTOR_ON_LEAVE",
      totalSlots: 0,
      availableSlots: 0,
      slots: [],
    };
  }

  if (!schedule.startTime || !schedule.endTime) {
    return {
      success: true,
      reason: "WORKING_HOURS_NOT_SET",
      totalSlots: 0,
      availableSlots: 0,
      slots: [],
    };
  }

  const slotDuration = schedule.slotDuration ?? doctor.consultationDuration;

  if (slotDuration <= 0) {
    throw new Error("Invalid slot duration.");
  }

  const startMinutes = timeToMinutes(schedule.startTime);

  const endMinutes = timeToMinutes(schedule.endTime);

  const slots = [];

  for (
    let current = startMinutes;
    current + slotDuration <= endMinutes;
    current += slotDuration
  ) {
    slots.push(
      createSlot(
    current,
    slotDuration,
    new Date(schedule.scheduleDate),
    schedule.timezone,
)
    );
  }

  applyBreaks(slots, schedule.breaks);

  applyBookedAppointments(slots, appointments, schedule.timezone);

  return {
    success: true,

    timezone: schedule.timezone,

    consultationDuration: slotDuration,

    appointmentDate: schedule.scheduleDate,

    totalSlots: slots.length,

    availableSlots: slots.filter((slot) => slot.available).length,

    slots,
  };
}

/* -------------------------------------------------------------------------- */
/*                               Apply Breaks                                 */
/* -------------------------------------------------------------------------- */

function applyBreaks(slots, breaks = []) {
  if (!Array.isArray(breaks) || breaks.length === 0) {
    return;
  }

  for (const slot of slots) {
    const slotStart = timeToMinutes(slot.startTime);

    const slotEnd = timeToMinutes(slot.endTime);

    for (const doctorBreak of breaks) {
      const breakStart = timeToMinutes(doctorBreak.startTime);

      const breakEnd = timeToMinutes(doctorBreak.endTime);

      if (overlaps(slotStart, slotEnd, breakStart, breakEnd)) {
        slot.available = false;

        slot.status = "BREAK";

        slot.reason = "BREAK";

        slot.breakId = doctorBreak.id;

        slot.breakTitle = doctorBreak.title ?? "Break";

        break;
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                           Apply Booked Slots                               */
/* -------------------------------------------------------------------------- */

function applyBookedAppointments(
  slots,
  appointments = [],
  timezone = "Asia/Kolkata",
) {
  if (!Array.isArray(appointments) || appointments.length === 0) {
  return;
}

  const bookedAppointments = new Map();

  for (const appointment of appointments) {
    bookedAppointments.set(
      getAppointmentTime(appointment.startTime, timezone),
      appointment,
    );
  }

  for (const slot of slots) {
    const appointment = bookedAppointments.get(slot.startTime);

    if (!appointment) continue;

    slot.available = false;

    slot.status = "BOOKED";

    slot.reason = "BOOKED";

    slot.appointmentId = appointment.id;
  }
}
