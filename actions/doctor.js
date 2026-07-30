"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/prisma";

import {
  getDoctorMonthlySchedule,
  saveMonthlySchedule,
  getDoctorScheduledDates,
} from "./scheduling";


/* -------------------------------------------------------------------------- */
/*                             Helper Function                                */
/* -------------------------------------------------------------------------- */

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

  return doctor;
}

/* -------------------------------------------------------------------------- */
/*                       monthly Availability                                  */
/* -------------------------------------------------------------------------- */


/**
 * Returns doctor's monthly schedule.
 */

export async function getDoctorAvailability({
  year,
  month,
} = {}) {
  return await getDoctorMonthlySchedule({
    year,
    month,
  });
}

/**
 * Saves doctor's monthly schedule.
 */
export async function setAvailabilitySlots(data) {
  return await saveMonthlySchedule(data);
}


export async function getDoctorScheduleDates(
  year,
  month,
) {
  return await getDoctorScheduledDates(
    year,
    month,
  );
}



/* -------------------------------------------------------------------------- */
/*                        Doctor Appointments                                 */
/* -------------------------------------------------------------------------- */

export async function getDoctorAppointments() {
  const doctor = await getCurrentDoctor();

  try {
    const appointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
      },

      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
      },

      orderBy: {
        startTime: "asc",
      },
    });

    return {
      success: true,
      appointments,
    };
  } catch (error) {
    console.error("Doctor Appointment Error:", error);

    throw new Error(error.message ?? "Failed to fetch appointments.");
  }
}

/* -------------------------------------------------------------------------- */
/*                     Cancel Appointment                                     */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                     Cancel Appointment                                     */
/* -------------------------------------------------------------------------- */

export async function cancelAppointment(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const appointmentId = formData.get("appointmentId");

  if (!appointmentId) {
    throw new Error("Appointment ID is required.");
  }

  try {
    const user = await db.user.findFirst({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      throw new Error("User not found.");
    }

    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
      },

      include: {
        doctor: true,
        patient: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found.");
    }

    const isParticipant =
      appointment.doctorId === user.id || appointment.patientId === user.id;

    if (!isParticipant) {
      throw new Error("You are not authorized to cancel this appointment.");
    }

    if (appointment.status !== "SCHEDULED") {
      throw new Error("Appointment has already been processed.");
    }

    await db.$transaction(async (tx) => {
      await tx.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          status: "CANCELLED",
        },
      });

      await tx.user.update({
        where: {
          id: appointment.patientId,
        },
        data: {
          credits: {
            increment: 2,
          },
        },
      });

      await tx.user.update({
        where: {
          id: appointment.doctorId,
        },
        data: {
          credits: {
            decrement: 2,
          },
        },
      });

      await tx.creditTransaction.createMany({
        data: [
          {
            userId: appointment.patientId,
            amount: 2,
            type: "APPOINTMENT_DEDUCTION",
          },
          {
            userId: appointment.doctorId,
            amount: -2,
            type: "APPOINTMENT_DEDUCTION",
          },
        ],
      });
    });

revalidatePath("/appointments");
revalidatePath("/doctor");
revalidatePath("/doctor/schedule");
    return {
      success: true,
    };
  } catch (error) {
    console.error("Cancel Appointment Error:", error);

    throw new Error(error.message ?? "Failed to cancel appointment.");
  }
}

/* -------------------------------------------------------------------------- */
/*                        Appointment Notes                                   */
/* -------------------------------------------------------------------------- */

export async function addAppointmentNotes(formData) {
  const doctor = await getCurrentDoctor();

  const appointmentId = formData.get("appointmentId");
  const notes = formData.get("notes");

  if (!appointmentId) {
    throw new Error("Appointment ID is required.");
  }

  try {
    const appointment = await db.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found.");
    }

    const updatedAppointment = await db.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        notes: notes ?? "",
      },
    });

    revalidatePath("/doctor");
revalidatePath("/doctor/schedule");

    return {
      success: true,
      appointment: updatedAppointment,
    };
  } catch (error) {
    console.error("Appointment Notes Error:", error);

    throw new Error(error.message ?? "Failed to update notes.");
  }
}

/* -------------------------------------------------------------------------- */
/*                  Mark Appointment Completed                                */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*                  Mark Appointment Completed                                */
/* -------------------------------------------------------------------------- */

export async function markAppointmentCompleted(formData) {
  const doctor = await getCurrentDoctor();

  const appointmentId = formData.get("appointmentId");

  if (!appointmentId) {
    throw new Error("Appointment ID is required.");
  }

  try {
    const appointment = await db.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
      },

      include: {
        patient: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found.");
    }

    if (appointment.status !== "SCHEDULED") {
      throw new Error(
        "Only scheduled appointments can be marked as completed.",
      );
    }

    const now = new Date();

    if (now < appointment.endTime) {
      throw new Error(
        "Cannot mark appointment as completed before the consultation ends.",
      );
    }

    const updatedAppointment = await db.appointment.update({
      where: {
        id: appointment.id,
      },
      data: {
        status: "COMPLETED",
      },
    });

    revalidatePath("/doctor");
revalidatePath("/doctor/schedule");
revalidatePath("/appointments");

    return {
      success: true,
      appointment: updatedAppointment,
    };
  } catch (error) {
    console.error("Mark Appointment Completed Error:", error);

    throw new Error(
      error.message ?? "Failed to mark appointment as completed.",
    );
  }
}