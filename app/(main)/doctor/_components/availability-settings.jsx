"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

import {
  Loader2,
  CalendarDays,
  Coffee,
  Save,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

import { toast } from "sonner";

import useFetch from "@/hooks/use-fetch";

import {
  getDoctorMonthlySchedule,
  saveMonthlySchedule,
} from "@/actions/scheduling";

/* ============================================================
   Constants
============================================================ */

const DEFAULT_DURATION = 30;

const DEFAULT_START = "09:00";

const DEFAULT_END = "17:00";

/* ============================================================
   Date Helpers
============================================================ */

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function monthName(date) {
  return date.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
}

function getMonthDates(currentMonth) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const totalDays = new Date(year, month + 1, 0).getDate();

  const dates = [];

  for (let day = 1; day <= totalDays; day++) {
    dates.push(new Date(year, month, day, 12));
  }

  return dates;
}

/* ============================================================
   Schedule Helpers
============================================================ */

function createEmptySchedule(date) {
  return {
    scheduleDate: date, 

    isAvailable: false,

    startTime: DEFAULT_START,

    endTime: DEFAULT_END,

    slotDuration: DEFAULT_DURATION,

    breaks: [],
  };
}

function updateBreak(schedule, breakId, updates) {
  return {
    ...schedule,

    breaks: schedule.breaks.map((item) =>
      item.id === breakId
        ? {
            ...item,
            ...updates,
          }
        : item
    ),
  };
}

function removeBreak(schedule, breakId) {
  return {
    ...schedule,

    breaks: schedule.breaks.filter((item) => item.id !== breakId),
  };
}

function addBreak(schedule) {
  return {
    ...schedule,

    breaks: [
      ...(schedule.breaks ?? []),

      {
        id: crypto.randomUUID(),

        title: "",

        startTime: "13:00",

        endTime: "13:30",
      },
    ],
  };
}

function validateSchedule(schedule) {
  if (!schedule.isAvailable) return null;

  if (!schedule.startTime || !schedule.endTime) {
    return "Working hours are required.";
  }

  if (schedule.startTime >= schedule.endTime) {
    return "End time must be after start time.";
  }

  return null;
}

/* ============================================================
   Component
============================================================ */

export function AvailabilitySettings() {
  /* ============================================================
     Server Actions
  ============================================================ */

  const {
    loading,
    data,
    error,
    fn: loadSchedule,
  } = useFetch(getDoctorMonthlySchedule);

  const {
    loading: saving,
    data: saveResponse,
    error: saveError,
    fn: saveSchedule,
  } = useFetch(saveMonthlySchedule);

  /* ============================================================
     Local State
  ============================================================ */

  const [consultationDuration, setConsultationDuration] =
    useState(DEFAULT_DURATION);

  const [timezone, setTimezone] =
    useState("Asia/Kolkata");

  const [currentMonth, setCurrentMonth] =
    useState(new Date());

  const [selectedDate, setSelectedDate] =
    useState(formatDate(new Date()));

  /**
   * Object format:
   *
   * {
   *   "2026-08-01": {...},
   *   "2026-08-02": {...}
   * }
   */
  const [monthlySchedule, setMonthlySchedule] =
    useState({});

  const monthDates = useMemo(
    () => getMonthDates(currentMonth),
    [currentMonth]
  );

  const selectedSchedule =
    monthlySchedule[selectedDate] ??
    createEmptySchedule(selectedDate);
      /* ============================================================
     Initial Load
  ============================================================ */

  useEffect(() => {
    loadSchedule({
      year: currentMonth.getFullYear(),
      month: currentMonth.getMonth() + 1,
    });
  }, [currentMonth]);

  /* ============================================================
     Populate State
  ============================================================ */

  useEffect(() => {
    if (!data?.success) return;

    setConsultationDuration(
      data.consultationDuration ?? DEFAULT_DURATION
    );

    setTimezone(
      data.timezone ?? "Asia/Kolkata"
    );

    const scheduleMap = {};

    (data.schedules ?? []).forEach((schedule) => {
      scheduleMap[schedule.date] = {
  ...schedule,
  scheduleDate: schedule.date,
  breaks: schedule.breaks ?? [],
};
    });

    setMonthlySchedule(scheduleMap);
  }, [data]);

  /* ============================================================
     Toasts
  ============================================================ */

  useEffect(() => {
    if (saveResponse?.success) {
      toast.success("Schedule saved successfully.");
    }
  }, [saveResponse]);

  useEffect(() => {
    if (saveError) {
      toast.error(saveError.message);
    }
  }, [saveError]);

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  /* ============================================================
     Month Navigation
  ============================================================ */

  function previousMonth() {
    setCurrentMonth((previous) => {
      const date = new Date(previous);

      date.setMonth(date.getMonth() - 1);

      return date;
    });
  }

  function nextMonth() {
    setCurrentMonth((previous) => {
      const date = new Date(previous);

      date.setMonth(date.getMonth() + 1);

      return date;
    });
  }

  /* ============================================================
     Date Selection
  ============================================================ */

  function selectDate(date) {
  console.log("Clicked Date object:", date);
  console.log("Formatted:", formatDate(date));

  setSelectedDate(formatDate(date));
}

  /* ============================================================
     Schedule Update Helpers
  ============================================================ */

  function updateCurrentSchedule(updates) {
    setMonthlySchedule((previous) => ({
      ...previous,

      [selectedDate]: {
        ...(previous[selectedDate] ??
    createEmptySchedule(selectedDate)),

scheduleDate: selectedDate,

...updates,
      },
    }));
  }

  function toggleAvailability(value) {
    updateCurrentSchedule({
      isAvailable: value,
    });
  }

  function changeStartTime(value) {
    updateCurrentSchedule({
      startTime: value,
    });
  }

  function changeEndTime(value) {
    updateCurrentSchedule({
      endTime: value,
    });
  }

  function changeDuration(value) {
    updateCurrentSchedule({
      slotDuration: Number(value),
    });
  }

  /* ============================================================
     Break Handlers
  ============================================================ */

  function handleAddBreak() {
    setMonthlySchedule((previous) => ({
      ...previous,

      [selectedDate]: addBreak(
        previous[selectedDate] ??
          createEmptySchedule(selectedDate)
      ),
    }));
  }

  function handleRemoveBreak(id) {
    setMonthlySchedule((previous) => ({
      ...previous,

      [selectedDate]: removeBreak(
        previous[selectedDate],
        id
      ),
    }));
  }

  function handleBreakChange(
    breakId,
    field,
    value
  ) {
    setMonthlySchedule((previous) => ({
      ...previous,

      [selectedDate]: updateBreak(
        previous[selectedDate],
        breakId,
        {
          [field]: value,
        }
      ),
    }));
  }

  /* ============================================================
     Validation
  ============================================================ */

  const validationError = useMemo(() => {
    return validateSchedule(selectedSchedule);
  }, [selectedSchedule]);

  /* ============================================================
     Save
  ============================================================ */

  async function handleSave() {
    if (validationError) {
      toast.error(validationError);
      return;
    }

    console.log("selectedDate:", selectedDate);

console.log(
  "selectedSchedule.scheduleDate:",
  selectedSchedule.scheduleDate
);

console.log("Sending:", {
  consultationDuration,
  timezone,
  schedule: {
    ...selectedSchedule,
    scheduleDate: selectedDate,
  },
});

    await saveSchedule({
      consultationDuration,

      timezone,

      schedule: {
  ...selectedSchedule,
  scheduleDate: selectedDate,
},
    });
  }
    /* ============================================================
     Render
  ============================================================ */

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-900/20">

      {/* ======================================================= */}
      {/* Header */}
      {/* ======================================================= */}

      <CardHeader>

        <CardTitle className="flex items-center gap-2">

          <CalendarDays className="h-5 w-5 text-emerald-500" />

          Monthly Availability

        </CardTitle>

        <CardDescription>

          Configure your availability for each date of the month.

        </CardDescription>

      </CardHeader>

      <CardContent className="space-y-8">

        {/* ======================================================= */}
        {/* Global Settings */}
        {/* ======================================================= */}

        <div className="grid gap-6 md:grid-cols-2">

          <div className="space-y-2">

            <Label>Consultation Duration (minutes)</Label>

            <Input
              type="number"
              min={5}
              step={5}
              value={consultationDuration}
              onChange={(e) =>
                setConsultationDuration(Number(e.target.value))
              }
            />

          </div>

          <div className="space-y-2">

            <Label>Timezone</Label>

            <Input
              value={timezone}
              onChange={(e) =>
                setTimezone(e.target.value)
              }
            />

          </div>

        </div>

        <Separator />

        {/* ======================================================= */}
        {/* Month Navigation */}
        {/* ======================================================= */}

        <div className="flex items-center justify-between">

          <Button
            variant="outline"
            type="button"
            onClick={previousMonth}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <h2 className="text-xl font-bold">
            {monthName(currentMonth)}
          </h2>

          <Button
            variant="outline"
            type="button"
            onClick={nextMonth}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>

        </div>

        {/* ======================================================= */}
        {/* Calendar */}
        {/* ======================================================= */}

        <div className="grid grid-cols-7 gap-2">

          {monthDates.map((date) => {

            const key = formatDate(date);

            const schedule =
              monthlySchedule[key];

            const selected =
              selectedDate === key;

            return (

              <Button
                key={key}
                type="button"
                variant={
                  selected
                    ? "default"
                    : "outline"
                }
                onClick={() => selectDate(date)}
                className={`h-20 flex-col gap-1 ${
                  schedule?.isAvailable
                    ? "border-emerald-500"
                    : ""
                }`}
              >

                <span className="text-lg font-bold">

                  {date.getDate()}

                </span>

                {schedule?.isAvailable && (

                  <span className="text-xs text-emerald-500">

                    Available

                  </span>

                )}

              </Button>

            );

          })}

        </div>

        <Separator />

        {/* ======================================================= */}
        {/* Selected Date */}
        {/* ======================================================= */}

        <Card>

          <CardHeader>

            <CardTitle>

              Schedule for {selectedDate}

            </CardTitle>

            <CardDescription>

              Configure working hours and breaks for the selected day.

            </CardDescription>

          </CardHeader>

          <CardContent className="space-y-6">
            {/* ===================================================== */}
            {/* Availability */}
            {/* ===================================================== */}

            <div className="flex items-center justify-between">

              <div>

                <h3 className="font-semibold">
                  Available on this day
                </h3>

                <p className="text-sm text-muted-foreground">
                  Toggle whether patients can book appointments.
                </p>

              </div>

              <Checkbox
                checked={selectedSchedule.isAvailable}
                onCheckedChange={(checked) =>
                  toggleAvailability(checked === true)
                }
              />

            </div>

            {selectedSchedule.isAvailable && (
              <>
  <Separator />

  {/* ===================================================== */}
  {/* Working Hours */}
  {/* ===================================================== */}

  <div className="grid gap-6 md:grid-cols-3">
    <div className="space-y-2">
      <Label>Start Time</Label>
      <Input
        type="time"
        value={selectedSchedule.startTime}
        onChange={(e) => changeStartTime(e.target.value)}
      />
    </div>

    <div className="space-y-2">
      <Label>End Time</Label>
      <Input
        type="time"
        value={selectedSchedule.endTime}
        onChange={(e) => changeEndTime(e.target.value)}
      />
    </div>

    <div className="space-y-2">
      <Label>Slot Duration</Label>
      <Input
        type="number"
        min={5}
        step={5}
        value={
          selectedSchedule.slotDuration ?? consultationDuration
        }
        onChange={(e) => changeDuration(e.target.value)}
      />
    </div>
  </div>

  <Separator />

  {/* ===================================================== */}
  {/* Break Header */}
  {/* ===================================================== */}

  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Coffee className="h-4 w-4 text-orange-500" />
      <h3 className="font-semibold">Breaks</h3>
    </div>

    <Button
      type="button"
      variant="outline"
      onClick={handleAddBreak}
    >
      <Plus className="mr-2 h-4 w-4" />
      Add Break
    </Button>
  </div>

  {(selectedSchedule.breaks ?? []).length === 0 && (
    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      No breaks added.
    </div>
  )}

  {(selectedSchedule.breaks ?? []).length > 0 && (
    <div className="space-y-4">
      {(selectedSchedule.breaks ?? []).map((doctorBreak) => (
        <Card
          key={doctorBreak.id}
          className="border-muted"
        >
          <CardContent className="p-4">
            <div className="grid gap-4 md:grid-cols-4">
              {/* Break Title */}
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Lunch"
                  value={doctorBreak.title ?? ""}
                  onChange={(e) =>
                    handleBreakChange(
                      doctorBreak.id,
                      "title",
                      e.target.value
                    )
                  }
                />
              </div>

              {/* Start */}
              <div className="space-y-2">
                <Label>Start</Label>
                <Input
                  type="time"
                  value={doctorBreak.startTime}
                  onChange={(e) =>
                    handleBreakChange(
                      doctorBreak.id,
                      "startTime",
                      e.target.value
                    )
                  }
                />
              </div>

              {/* End */}
              <div className="space-y-2">
                <Label>End</Label>
                <Input
                  type="time"
                  value={doctorBreak.endTime}
                  onChange={(e) =>
                    handleBreakChange(
                      doctorBreak.id,
                      "endTime",
                      e.target.value
                    )
                  }
                />
              </div>

              {/* Delete */}
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  onClick={() =>
                    handleRemoveBreak(doctorBreak.id)
                  }
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )}
</>

            )}

          </CardContent>

        </Card>

        <Separator />

        {/* ======================================================= */}
        {/* Validation */}
        {/* ======================================================= */}

        {validationError && (

          <Card className="border-red-500/30 bg-red-500/5">

            <CardContent className="flex items-start gap-3 p-4">

              <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />

              <div>

                <h3 className="font-semibold text-red-500">

                  Validation Error

                </h3>

                <p className="mt-1 text-sm text-muted-foreground">

                  {validationError}

                </p>

              </div>

            </CardContent>

          </Card>

        )}

        {/* ======================================================= */}
        {/* Save */}
        {/* ======================================================= */}

        <div className="flex justify-end">

          <Button
            onClick={handleSave}
            disabled={saving}
            className="min-w-[180px] bg-emerald-600 hover:bg-emerald-700"
          >

            {saving ? (

              <>

                <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                Saving...

              </>

            ) : (

              <>

                <Save className="mr-2 h-4 w-4" />

                Save Schedule

              </>

            )}

          </Button>

        </div>

      </CardContent>

    </Card>

  );

}