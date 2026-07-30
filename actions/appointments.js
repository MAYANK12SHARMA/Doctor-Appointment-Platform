"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import {
 createVideoSession,
  generateVideoToken as createVonageToken,
} from "@/lib/vonage/video";

import { db } from "@/lib/prisma";

import { getAvailableSlots } from "./scheduling";

import { normalizeDate } from "@/lib/scheduling/date-utils";


/* -------------------------------------------------------------------------- */
/*                               Helper Methods                               */
/* -------------------------------------------------------------------------- */

/**
 * Returns the currently logged-in patient.
 */
async function getCurrentPatient() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const patient = await db.user.findFirst({
    where: {
      clerkUserId: userId,
      role: "PATIENT",
    },
  });

  if (!patient) {
    throw new Error("Patient account not found.");
  }

  return patient;
}

/**
 * Creates a Date object from
 * appointment date + HH:mm
 */
function combineDateAndTime(date, time) {
  const [hours, minutes] = time.split(":").map(Number);

  const result = new Date(date);

  result.setHours(hours, minutes, 0, 0);

  return result;
}

/**
 * Validates that the selected slot still exists
 * and is available.
 */
async function validateAppointmentSlot(
  doctorId,
  normalizedDate,
  startTime,
) {
  const result = await getAvailableSlots(doctorId, normalizedDate);

  if (!result.success) {
    throw new Error("Unable to fetch available slots.");
  }

  const slot = result.slots.find((item) => item.startTime === startTime);

  if (!slot) {
    throw new Error("Selected slot does not exist.");
  }

  if (!slot.available) {
    throw new Error("Selected slot is no longer available.");
  }

  return slot;
}

/**
 * Calculates appointment end time.
 *
 * Example:
 * 09:00 + 30 min -> 09:30
 */
function calculateEndTime(startTime, duration) {
    const [hour, minute] = startTime.split(":").map(Number);

    const totalMinutes = hour * 60 + minute + duration;

    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;

    return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
}

/**
 * Appointment cost.
 */
const APPOINTMENT_COST = 2;
/* -------------------------------------------------------------------------- */
/*                           Book Appointment                                 */
/* -------------------------------------------------------------------------- */

export async function bookAppointment(formData) {
  try {
    const patient = await getCurrentPatient();

    const doctorId = formData.get("doctorId");
    const appointmentDate = formData.get("appointmentDate");
    const normalizedDate = normalizeDate(appointmentDate);
    const startTime = formData.get("startTime");
    const patientDescription = formData.get("patientDescription") ?? "";

    /* ---------------------------------------------------------------------- */
    /*                          Validate Request                              */
    /* ---------------------------------------------------------------------- */

    if (!doctorId) {
      throw new Error("Doctor is required.");
    }

    if (!appointmentDate) {
      throw new Error("Appointment date is required.");
    }

    if (!startTime) {
      throw new Error("Appointment time is required.");
    }

    if (patient.credits < APPOINTMENT_COST) {
      throw new Error(
        "You don't have enough credits to book this appointment.",
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                           Fetch Doctor                                 */
    /* ---------------------------------------------------------------------- */

    const doctor = await db.user.findFirst({
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
    });

    if (!doctor) {
      throw new Error("Doctor not found.");
    }

    if (doctor.verificationStatus !== "VERIFIED") {
      throw new Error("Doctor profile is not verified.");
    }

    /* ---------------------------------------------------------------------- */
    /*                        Validate Selected Slot                          */
    /* ---------------------------------------------------------------------- */

    const slot = await validateAppointmentSlot(
      doctor.id,
      normalizedDate,
      startTime,
    );

    const endTimeString = calculateEndTime(
      slot.startTime,
      slot.durationMinutes,
    );

    const today = normalizeDate(new Date());

    if (normalizedDate < today) {
      throw new Error("Cannot book appointments for past dates.");
    }

    const startDateTime = combineDateAndTime(normalizedDate, slot.startTime);

    const now = new Date();

    if (normalizedDate.getTime() === today.getTime() && startDateTime <= now) {
      throw new Error("This appointment slot has already passed.");
    }

    const endDateTime = combineDateAndTime(normalizedDate, endTimeString);
    /* ---------------------------------------------------------------------- */
    /*                     Create Video Session                               */
    /* ---------------------------------------------------------------------- */

    const sessionId = await createVideoSession();

    /* ---------------------------------------------------------------------- */
    /*                    Begin Database Transaction                          */
    /* ---------------------------------------------------------------------- */

    const appointment = await db.$transaction(async (tx) => {
      /**
       * Check again inside the transaction.
       * This prevents two patients from booking
       * the same slot simultaneously.
       */
      const existingAppointment = await tx.appointment.findUnique({
        where: {
          doctorId_appointmentDate_startTime: {
            doctorId: doctor.id,
            appointmentDate: normalizedDate,
            startTime: startDateTime,
          },
        },
      });

      if (existingAppointment) {
        throw new Error("This appointment slot has already been booked.");
      } /**
       * Create appointment.
       */
      const createdAppointment = await tx.appointment.create({
        data: {
          patientId: patient.id,

          doctorId: doctor.id,

          appointmentDate: normalizedDate,

          startTime: startDateTime,

          endTime: endDateTime,

          durationMinutes: slot.durationMinutes,

          timezone: slot.timezone,

          patientDescription,

          status: "SCHEDULED",

          /**
           * Store only the session id.
           * Video tokens are generated dynamically
           * whenever doctor/patient joins.
           */
          videoSessionId: sessionId,
        },
      });

      /* -------------------------------------------------------------- */
      /*                        Update Credits                          */
      /* -------------------------------------------------------------- */

      await tx.user.update({
        where: {
          id: patient.id,
        },
        data: {
          credits: {
            decrement: APPOINTMENT_COST,
          },
        },
      });

      await tx.user.update({
        where: {
          id: doctor.id,
        },
        data: {
          credits: {
            increment: APPOINTMENT_COST,
          },
        },
      });

      /* -------------------------------------------------------------- */
      /*                  Credit Transaction History                    */
      /* -------------------------------------------------------------- */

      await tx.creditTransaction.createMany({
        data: [
          {
            userId: patient.id,

            amount: -APPOINTMENT_COST,

            type: "APPOINTMENT_DEDUCTION",
          },

          {
            userId: doctor.id,

            amount: APPOINTMENT_COST,

            type: "APPOINTMENT_DEDUCTION",
          },
        ],
      });

      return createdAppointment;
    });

    /* ---------------------------------------------------------------------- */
    /*                          Revalidate Cache                              */
    /* ---------------------------------------------------------------------- */

    revalidatePath("/appointments");
    revalidatePath("/doctor");
    revalidatePath("/doctors");

    return {
      success: true,

      message: "Appointment booked successfully.",

      appointment,
    };
  } catch (error) {
    /**
     * Prisma Unique Constraint
     *
     * Handles simultaneous bookings.
     */
    if (error.code === "P2002") {
      throw new Error("This appointment slot has already been booked.");
    }

    console.error("Book Appointment Error");

    console.error(error);

    console.error(error.stack);

    throw new Error(error.message || "Failed to book appointment.");
  }
}

/* -------------------------------------------------------------------------- */
/*                            Get Doctor Details                              */
/* -------------------------------------------------------------------------- */

export async function getDoctorById(doctorId) {
  if (!doctorId) {
    throw new Error("Doctor ID is required.");
  }

  try {
    const doctor = await db.user.findFirst({
      where: {
        id: doctorId,
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },

      select: {
        id: true,

        name: true,

        email: true,

        imageUrl: true,

        specialty: true,

        experience: true,

        description: true,

        consultationDuration: true,

        timezone: true,

        verificationStatus: true,
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found.");
    }

    return {
      success: true,
      doctor,
    };
  } catch (error) {
    console.error("Get Doctor Error:", error);

    throw new Error(error.message ?? "Failed to fetch doctor.");
  }
}

/* -------------------------------------------------------------------------- */
/*                      Generate Video Token                                  */
/* -------------------------------------------------------------------------- */

// console.log("==================================");
// console.log("Appointment:", appointmentId);
// console.log("Session:", appointment.videoSessionId);
// console.log("User:", user.role);
// console.log("==================================");

export async function generateVideoToken(appointmentId) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!appointmentId) {
    throw new Error("Appointment ID is required.");
  }

  try {
    const user = await db.user.findFirst({
      where: {
        clerkUserId: userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error("User not found.");
    }

    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      select: {
        doctorId: true,
        patientId: true,
        status: true,
        videoSessionId: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found.");
    }

    if (appointment.doctorId !== user.id && appointment.patientId !== user.id) {
      throw new Error("Unauthorized");
    }

    if (appointment.status !== "SCHEDULED") {
      throw new Error("Appointment is not active.");
    }

    if (!appointment.videoSessionId) {
      throw new Error("Video session not found.");
    }

    const token = createVonageToken(appointment.videoSessionId, "publisher");

    return {
      success: true,
      sessionId: appointment.videoSessionId,
      token,
    };
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
}