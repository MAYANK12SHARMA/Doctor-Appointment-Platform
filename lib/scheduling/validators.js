
/**
 * Validate booking request
 */
export function validateSlotGeneration({ doctor, schedule }) {
  if (!doctor) {
    throw new Error("Doctor not found.");
  }

  if (!schedule) {
    return;
  }

  if (schedule.isAvailable && (!schedule.startTime || !schedule.endTime)) {
    throw new Error("Working hours are missing.");
  }
}
