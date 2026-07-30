"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  Loader2,
  Clock,
  ArrowLeft,
  Calendar,
  CreditCard,
} from "lucide-react";

import { toast } from "sonner";

import useFetch from "@/hooks/use-fetch";
import { bookAppointment } from "@/actions/appointments";

export function AppointmentForm({
  doctorId,
  slot,
  onBack,
  onComplete,
}) {
  const [description, setDescription] = useState("");

  const {
    loading,
    data,
    error,
    fn: submitBooking,
  } = useFetch(bookAppointment);

  useEffect(() => {
    if (!error) return;

    toast.error(error.message);
  }, [error]);

  useEffect(() => {
    if (!data?.success) return;

    toast.success(data.message);

    onComplete?.(data.appointment);
  }, [data, onComplete]);

  async function handleSubmit(e) {
  e.preventDefault();

  if (!(slot.appointmentDate instanceof Date)) {
    throw new Error("Invalid appointment date.");
  }

  const formData = new FormData();

  formData.append("doctorId", doctorId);

  formData.append(
    "appointmentDate",
    format(slot.appointmentDate, "yyyy-MM-dd"),
  );

  formData.append(
    "startTime",
    slot.startTime,
  );

  formData.append(
    "patientDescription",
    description,
  );

  await submitBooking(formData);
}

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="rounded-lg border border-emerald-900/20 bg-muted/20 p-5 space-y-4">

        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-emerald-500" />

          <span className="font-medium">
            {format(
              new Date(slot.appointmentDate),
              "EEEE, dd MMMM yyyy",
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-500" />

          <span>
            {slot.displayStartTime}
            {" - "}
            {slot.displayEndTime}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-500" />

          <span>
            Duration :
            <strong className="ml-1">
              {slot.durationMinutes} minutes
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-emerald-500" />

          <span>
            Cost :
            <strong className="ml-1">
              2 Credits
            </strong>
          </span>
        </div>

      </div>

      <div className="space-y-2">

        <Label htmlFor="description">
          Medical Concern (Optional)
        </Label>

        <Textarea
          id="description"
          maxLength={1000}
          value={description}
          placeholder="Describe your symptoms or what you'd like to discuss..."
          onChange={(e) =>
            setDescription(e.target.value)
          }
          className="h-32"
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            This will be visible to your doctor before the consultation.
          </span>

          <span>
            {description.length}/1000
          </span>
        </div>

      </div>

      <div className="flex justify-between">

        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />

          Change Slot
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Booking...
            </>
          ) : (
            "Confirm Appointment"
          )}
        </Button>

      </div>
    </form>
  );
}