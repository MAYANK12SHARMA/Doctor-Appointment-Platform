"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/prisma";

import { normalizeDate } from "@/lib/scheduling/date-utils";

import { generateAvailableSlots } from "@/lib/scheduling/slot-generator";

/* -------------------------------------------------------------------------- */
/*                               Helper Methods                               */
/* -------------------------------------------------------------------------- */

/**
 * Returns currently logged in doctor
 */
async function getCurrentDoctor() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const doctor = await db.user.findFirst({
    where: {
      clerkUserId: userId,
      role: "DOCTOR",
    },
  });

  if (!doctor) {
    throw new Error("Doctor account not found.");
  }

  if (doctor.verificationStatus !== "VERIFIED") {
    throw new Error("Doctor profile is not verified.");
  }

  return doctor;
}

/* -------------------------------------------------------------------------- */
/*                              Validation                                    */
/* -------------------------------------------------------------------------- */

function validateSchedule(schedule) {
  if (!schedule) {
    throw new Error("Schedule is required.");
  }

  if (!schedule.scheduleDate) {
    throw new Error("Schedule date is required.");
  }

  if (!schedule.isAvailable) {
    return;
  }

  if (!schedule.startTime || !schedule.endTime) {
    throw new Error("Working hours are required.");
  }

  if (schedule.startTime >= schedule.endTime) {
    throw new Error("End time must be after start time.");
  }
}

function validateBreak(schedule, doctorBreak) {
  if (!doctorBreak) return;

  if (!doctorBreak.startTime || !doctorBreak.endTime) {
    throw new Error("Break start and end time are required.");
  }

  if (doctorBreak.startTime >= doctorBreak.endTime) {
    throw new Error("Break end time must be after start time.");
  }

  if (doctorBreak.startTime < schedule.startTime) {
    throw new Error("Break starts before working hours.");
  }

  if (doctorBreak.endTime > schedule.endTime) {
    throw new Error("Break ends after working hours.");
  }
}

function validateBreakOverlaps(schedule) {
  const breaks = schedule.breaks ?? [];

  const sorted = [...breaks].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startTime < sorted[i - 1].endTime) {
      throw new Error("Break timings overlap.");
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                             Date Helpers                                   */
/* -------------------------------------------------------------------------- */

function getMonthRange(year, month) {
  const start = normalizeDate(
    new Date(year, month - 1, 1),
  );

  const end = normalizeDate(
    new Date(year, month, 0),
  );

  end.setHours(23, 59, 59, 999);

  return {
    start,
    end,
  };
}


function getWeekday(date) {
  return [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ][normalizeDate(date).getDay()];
}
/* -------------------------------------------------------------------------- */
/*                         Save Monthly Schedule                              */
/* -------------------------------------------------------------------------- */

export async function saveMonthlySchedule(data) {
  const doctor = await getCurrentDoctor();

  if (!data) {
    throw new Error("Schedule data is required.");
  }

  const { consultationDuration, timezone, schedule } = data;

  validateSchedule(schedule);

  const scheduleDate = normalizeDate(schedule.scheduleDate);

  const today = normalizeDate(new Date());
  console.log("Raw schedule:", schedule.scheduleDate);
  console.log("Normalized schedule:", scheduleDate.toISOString());
  console.log("Today:", today.toISOString());
  console.log("Comparison:", scheduleDate.getTime(), today.getTime());

if (scheduleDate < today) {
  throw new Error("Cannot create schedules for past dates.");
}

  validateBreakOverlaps(schedule);

  for (const doctorBreak of schedule.breaks ?? []) {
    validateBreak(schedule, doctorBreak);
  }

  const lastAllowedDate = normalizeDate(
  new Date(
    today.getFullYear(),
    today.getMonth() + 2,
    0,
  ),
);

lastAllowedDate.setHours(23, 59, 59, 999);

  if (scheduleDate > lastAllowedDate) {
    throw new Error("You can schedule only the current and next month.");
  }

  validateBreakOverlaps(schedule);

  for (const doctorBreak of schedule.breaks ?? []) {
    validateBreak(schedule, doctorBreak);
  }

  try {
    await db.$transaction(async (tx) => {
      /* ------------------------------------------------------------------ */
      /* Update Doctor Settings                                              */
      /* ------------------------------------------------------------------ */

      await tx.user.update({
        where: {
          id: doctor.id,
        },
        data: {
          consultationDuration,
          timezone,
        },
      });

      /* ------------------------------------------------------------------ */
      /* Create / Update Daily Schedule                                      */
      /* ------------------------------------------------------------------ */

      const savedSchedule = await tx.doctorSchedule.upsert({
        where: {
          doctorId_scheduleDate: {
            doctorId: doctor.id,
            scheduleDate,
          },
        },

        update: {
          weekday: getWeekday(scheduleDate),

          startTime: schedule.isAvailable ? schedule.startTime : "",

          endTime: schedule.isAvailable ? schedule.endTime : "",

          slotDuration: schedule.isAvailable
            ? (schedule.slotDuration ?? consultationDuration)
            : null,

          timezone,

          isAvailable: schedule.isAvailable,
        },

        create: {
          doctorId: doctor.id,

          scheduleDate,

          weekday: getWeekday(scheduleDate),

          startTime: schedule.isAvailable ? schedule.startTime : "",

          endTime: schedule.isAvailable ? schedule.endTime : "",

          slotDuration: schedule.isAvailable
            ? (schedule.slotDuration ?? consultationDuration)
            : null,

          timezone,

          isAvailable: schedule.isAvailable,
        },
      });

      /* ------------------------------------------------------------------ */
      /* Remove Previous Breaks                                              */
      /* ------------------------------------------------------------------ */

      await tx.doctorBreak.deleteMany({
        where: {
          scheduleId: savedSchedule.id,
        },
      });

      /* ------------------------------------------------------------------ */
      /* Insert Breaks                                                       */
      /* ------------------------------------------------------------------ */

      if (schedule.isAvailable && (schedule.breaks ?? []).length > 0) {
        await tx.doctorBreak.createMany({
          data: schedule.breaks.map((doctorBreak) => ({
            scheduleId: savedSchedule.id,

            title: doctorBreak.title?.trim() || null,

            startTime: doctorBreak.startTime,

            endTime: doctorBreak.endTime,
          })),
        });
      }
    });

    revalidatePath("/doctor");
    revalidatePath("/doctors");

    return {
      success: true,
      message: "Schedule saved successfully.",
    };
  } catch (error) {
    console.error("Save Monthly Schedule Error:", error);

    throw new Error(error.message ?? "Failed to save monthly schedule.");
  }
}
/* -------------------------------------------------------------------------- */
/*                       Get Doctor Monthly Schedule                           */
/* -------------------------------------------------------------------------- */

export async function getDoctorMonthlySchedule({ year, month } = {}) {
  const doctor = await getCurrentDoctor();

  try {
   const today = new Date();

year = year ?? today.getFullYear();
month = month ?? today.getMonth() + 1;

const currentMonth = normalizeDate(
  new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
  ),
);

const requestedMonth = normalizeDate(
  new Date(
    year,
    month - 1,
    1,
  ),
);

const maxMonth = normalizeDate(
  new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    1,
  ),
);

    if (requestedMonth < currentMonth) {
      throw new Error("Only current and next month's schedules can be viewed.");
    }

    year = year ?? today.getFullYear();
    month = month ?? today.getMonth() + 1;

    const { start, end } = getMonthRange(year, month);

    const schedules = await db.doctorSchedule.findMany({
      where: {
        doctorId: doctor.id,

        scheduleDate: {
          gte: start,
          lte: end,
        },
      },

      include: {
        breaks: {
          orderBy: {
            startTime: "asc",
          },
        },
      },

      orderBy: {
        scheduleDate: "asc",
      },
    });

    return {
      success: true,

      timezone: doctor.timezone,

      consultationDuration: doctor.consultationDuration,

      schedules: schedules.map((schedule) => ({
        id: schedule.id,

        date: `${schedule.scheduleDate.getFullYear()}-${String(
  schedule.scheduleDate.getMonth() + 1,
).padStart(2, "0")}-${String(
  schedule.scheduleDate.getDate(),
).padStart(2, "0")}`,

        weekday: schedule.weekday,

        startTime: schedule.startTime,

        endTime: schedule.endTime,

        slotDuration: schedule.slotDuration,

        isAvailable: schedule.isAvailable,

        breaks: schedule.breaks.map((item) => ({
          id: item.id,

          title: item.title,

          startTime: item.startTime,

          endTime: item.endTime,
        })),
      })),
    };
  } catch (error) {
    console.error("Get Monthly Schedule Error:", error);

    throw new Error(error.message ?? "Failed to fetch monthly schedule.");
  }
}
/* -------------------------------------------------------------------------- */
/*                         Get Available Slots                                */
/* -------------------------------------------------------------------------- */

export async function getAvailableSlots(doctorId, selectedDate) {
  console.log("🔥 getAvailableSlots CALLED");
  if (!doctorId) {
    throw new Error("Doctor ID is required.");
  }

  if (!selectedDate) {
    throw new Error("Appointment date is required.");
  }

  const scheduleDate = normalizeDate(selectedDate);

  console.log("========== DEBUG ==========");
  console.log("Doctor ID:", doctorId);
  console.log("Schedule Date:", scheduleDate);
  console.log("Schedule ISO:", scheduleDate.toISOString());

  try {
    const [doctor, schedule, leave, appointments] = await Promise.all([
      db.user.findFirst({
        where: {
          id: doctorId,
          role: "DOCTOR",
        },

        select: {
          id: true,
          name: true,
          timezone: true,
          consultationDuration: true,
          verificationStatus: true,
        },
      }),
      
        
      // db.doctorSchedule.findUnique({
      //   where: {
      //     doctorId_scheduleDate: {
      //       doctorId,
      //       scheduleDate,
      //     },
      //   },

      //   include: {
      //     breaks: {
      //       orderBy: {
      //         startTime: "asc",
      //       },
      //     },
      //   },
      // }),
      (async () => {
        const schedules = await db.doctorSchedule.findMany({
          where: {
            doctorId,
          },
          include: {
            breaks: true,
          },
        });

        console.log("All schedules for doctor:");
        console.table(
          schedules.map((s) => ({
            scheduleDate: s.scheduleDate,
            iso: s.scheduleDate.toISOString(),
            weekday: s.weekday,
          }))
        );

        const schedule = await db.doctorSchedule.findFirst({
          where: {
            doctorId,
            scheduleDate,
          },
          include: {
            breaks: {
              orderBy: {
                startTime: "asc",
              },
            },
          },
        });

        console.log("Matched schedule:", schedule);

        return schedule;
      })(),

      db.doctorLeave.findFirst({
        where: {
          doctorId,

          leaveDate: scheduleDate,
        },
      }),

      db.appointment.findMany({
        where: {
          doctorId,

          appointmentDate: scheduleDate,

          status: "SCHEDULED",
        },

        orderBy: {
          startTime: "asc",
        },
      }),
    ]);

    if (!doctor) {
      throw new Error("Doctor not found.");
    }

    if (doctor.verificationStatus !== "VERIFIED") {
      throw new Error("Doctor is not verified.");
    }

    if (!schedule) {
      return {
        success: true,
        reason: "NO_SCHEDULE",
        doctor: {
          id: doctor.id,
          name: doctor.name,
        },
        slots: [],
      };
    }

    if (!schedule.isAvailable) {
      return {
        success: true,
        reason: "DOCTOR_UNAVAILABLE",
        doctor: {
          id: doctor.id,
          name: doctor.name,
        },
        slots: [],
      };
    }

    const result = generateAvailableSlots({
      doctor,

      schedule,

      leave,

      appointments,
    });

    return {
      success: true,

      doctor: {
        id: doctor.id,
        name: doctor.name,
      },

      ...result,
    };
  } catch (error) {
    console.error("Slot Generation Error:", error);

    throw new Error(error.message ?? "Failed to fetch available slots.");
  }
}
/* -------------------------------------------------------------------------- */
/*                            Utility Functions                               */
/* -------------------------------------------------------------------------- */

/**
 * Returns all scheduled dates for the doctor in a month.
 * Used to highlight dates in the calendar.
 */
export async function getDoctorScheduledDates(year, month) {
  const doctor = await getCurrentDoctor();

  const today = new Date();

  year = year ?? today.getFullYear();
  month = month ?? today.getMonth() + 1;

  const currentMonth = normalizeDate(
    new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
    ),
);

  const requestedMonth = normalizeDate(
    new Date(year, month - 1, 1)
);

  const maxMonth = normalizeDate(
    new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        1,
    ),
);

  if (requestedMonth < currentMonth) {
    
    throw new Error("Invalid month requested.");
  }

  const { start, end } = getMonthRange(year, month);

  try {
    const schedules = await db.doctorSchedule.findMany({
      where: {
        doctorId: doctor.id,
        scheduleDate: {
          gte: start,
          lte: end,
        },
        isAvailable: true,
      },

      select: {
        scheduleDate: true,
      },

      orderBy: {
        scheduleDate: "asc",
      },
    });

    return {
      success: true,
      dates: schedules.map((item) => {
  const date = new Date(item.scheduleDate);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}),
    };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch scheduled dates.");
  }
}

/* -------------------------------------------------------------------------- */
/*                            Doctor Leaves                                   */
/* -------------------------------------------------------------------------- */

export async function getDoctorLeaves() {
  const doctor = await getCurrentDoctor();

  return db.doctorLeave.findMany({
    where: {
      doctorId: doctor.id,
    },

    orderBy: {
      leaveDate: "asc",
    },
  });
}

export async function addDoctorLeave(date, reason = "") {
  const doctor = await getCurrentDoctor();

  const leaveDate = normalizeDate(date);

  const existingLeave = await db.doctorLeave.findFirst({
    where: {
      doctorId: doctor.id,
      leaveDate,
    },
  });

  if (existingLeave) {
    throw new Error("Leave already exists for this date.");
  }

  await db.doctorLeave.create({
    data: {
      doctorId: doctor.id,

      leaveDate,

      reason,
    },
  });

  revalidatePath("/doctor");

  return {
    success: true,
  };
}

export async function removeDoctorLeave(id) {
  const doctor = await getCurrentDoctor();

  await db.doctorLeave.deleteMany({
    where: {
      id,

      doctorId: doctor.id,
    },
  });

  revalidatePath("/doctor");

  return {
    success: true,
  };
}
