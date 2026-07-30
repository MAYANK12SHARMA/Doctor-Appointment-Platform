"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/prisma";

/* -------------------------------------------------------------------------- */
/*                               Helper Methods                               */
/* -------------------------------------------------------------------------- */

/**
 * Returns the currently logged-in doctor.
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
    throw new Error("Your profile is not verified yet.");
  }

  return doctor;
}

/**
 * Removes time portion.
 */
function normalizeDate(date) {
  const normalized = new Date(date);

  normalized.setHours(0, 0, 0, 0);

  return normalized;
}

/**
 * Validate leave request.
 */
function validateLeave(data) {
  if (!data.leaveDate) {
    throw new Error("Leave date is required.");
  }

  const leaveDate = normalizeDate(data.leaveDate);

  const today = normalizeDate(new Date());

  if (leaveDate < today) {
    throw new Error("Past dates cannot be selected.");
  }

  if (data.reason && data.reason.length > 100) {
    throw new Error("Reason cannot exceed 100 characters.");
  }

  if (data.notes && data.notes.length > 500) {
    throw new Error("Notes cannot exceed 500 characters.");
  }

  return leaveDate;
}

/* -------------------------------------------------------------------------- */
/*                           Get Doctor Leaves                                */
/* -------------------------------------------------------------------------- */

export async function getDoctorLeaves() {
  const doctor = await getCurrentDoctor();

  try {
    const leaves = await db.doctorLeave.findMany({
      where: {
        doctorId: doctor.id,
      },
      orderBy: {
        leaveDate: "asc",
      },
    });

    return {
      success: true,
      leaves,
    };
  } catch (error) {
    console.error("Get Leave Error:", error);

    throw new Error(error.message ?? "Failed to fetch doctor leaves.");
  }
}

/* -------------------------------------------------------------------------- */
/*                           Create Doctor Leave                              */
/* -------------------------------------------------------------------------- */

export async function createDoctorLeave(data) {
  const doctor = await getCurrentDoctor();

  const leaveDate = validateLeave(data);

  try {
    /**
     * Prevent duplicate leave entries.
     */
    const existingLeave = await db.doctorLeave.findFirst({
      where: {
        doctorId: doctor.id,
        leaveDate,
      },
    });

    if (existingLeave) {
      throw new Error("A leave already exists for this date.");
    }

    const leave = await db.doctorLeave.create({
      data: {
        doctorId: doctor.id,

        leaveDate,

        reason: data.reason?.trim() || null,

        notes: data.notes?.trim() || null,
      },
    });

    revalidatePath("/doctor");
    revalidatePath("/doctor/schedule");

    return {
      success: true,
      message: "Leave added successfully.",
      leave,
    };
  } catch (error) {
    console.error("Create Leave Error:", error);

    throw new Error(error.message ?? "Failed to create leave.");
  }
}

/* -------------------------------------------------------------------------- */
/*                           Update Doctor Leave                              */
/* -------------------------------------------------------------------------- */

export async function updateDoctorLeave(leaveId, data) {
  const doctor = await getCurrentDoctor();

  if (!leaveId) {
    throw new Error("Leave ID is required.");
  }

  const leaveDate = validateLeave(data);

  try {
    /**
     * Verify ownership.
     */
    const leave = await db.doctorLeave.findFirst({
      where: {
        id: leaveId,
        doctorId: doctor.id,
      },
    });

    if (!leave) {
      throw new Error("Leave not found.");
    }

    /**
     * Prevent duplicate dates.
     */
    const existingLeave = await db.doctorLeave.findFirst({
      where: {
        doctorId: doctor.id,
        leaveDate,
        NOT: {
          id: leaveId,
        },
      },
    });

    if (existingLeave) {
      throw new Error("Another leave already exists for this date.");
    }

    const updatedLeave = await db.doctorLeave.update({
      where: {
        id: leaveId,
      },
      data: {
        leaveDate,
        reason: data.reason?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });

    revalidatePath("/doctor");
    revalidatePath("/doctor/schedule");

    return {
      success: true,
      message: "Leave updated successfully.",
      leave: updatedLeave,
    };
  } catch (error) {
    console.error("Update Leave Error:", error);

    throw new Error(error.message ?? "Failed to update leave.");
  }
}

/* -------------------------------------------------------------------------- */
/*                           Delete Doctor Leave                              */
/* -------------------------------------------------------------------------- */

export async function deleteDoctorLeave(leaveId) {
  const doctor = await getCurrentDoctor();

  if (!leaveId) {
    throw new Error("Leave ID is required.");
  }

  try {
    /**
     * Verify ownership.
     */
    const leave = await db.doctorLeave.findFirst({
      where: {
        id: leaveId,
        doctorId: doctor.id,
      },
    });

    if (!leave) {
      throw new Error("Leave not found.");
    }

    await db.doctorLeave.delete({
      where: {
        id: leaveId,
      },
    });

    revalidatePath("/doctor");
    revalidatePath("/doctor/schedule");

    return {
      success: true,
      message: "Leave deleted successfully.",
    };
  } catch (error) {
    console.error("Delete Leave Error:", error);

    throw new Error(error.message ?? "Failed to delete leave.");
  }
}
