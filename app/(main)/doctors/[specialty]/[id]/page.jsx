import { addDays } from "date-fns";
import { redirect } from "next/navigation";

import { getDoctorById } from "@/actions/appointments";
import { getAvailableSlots } from "@/actions/scheduling";
import { normalizeDate } from "@/lib/scheduling/date-utils";

import { DoctorProfile } from "./_components/doctor-profile";

export default async function DoctorProfilePage({ params }) {
  const { id } = await params;

  try {
    const response = await getDoctorById(id);

    if (!response?.success) {
      redirect("/doctors");
    }

    const doctor = response.doctor;

    const today = normalizeDate(new Date());

    const upcomingDates = Array.from({ length: 60 }, (_, index) =>
      addDays(today, index),
    );

    const availableDays = await Promise.all(
      upcomingDates.map(async (date) => {
        const normalizedDate = normalizeDate(date);

        const slotResponse = await getAvailableSlots(doctor.id, normalizedDate);

        return {
          date: new Date(normalizedDate),
          timezone: doctor.timezone,
          reason: slotResponse.reason ?? null,
          slots: slotResponse.slots ?? [],
        };
      }),
    );

    return <DoctorProfile doctor={doctor} availableDays={availableDays} />;
  } catch (error) {
    console.error("Doctor Profile Error:", error);
    redirect("/doctors");
  }
}
