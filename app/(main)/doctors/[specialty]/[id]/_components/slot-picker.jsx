"use client";

import { useEffect, useMemo, useState } from "react";

import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isToday,
  format,
} from "date-fns";

import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarDays,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SlotPicker({
  days = [],
  onSelectSlot,
}) {
  /* -------------------------------------------------------------------------- */
  /*                                  State                                     */
  /* -------------------------------------------------------------------------- */

  const [currentMonth, setCurrentMonth] = useState(
    startOfMonth(new Date()),
  );

  const [selectedDate, setSelectedDate] = useState(null);

  const [selectedSlot, setSelectedSlot] = useState(null);

  const [loading, setLoading] = useState(false);

  /* -------------------------------------------------------------------------- */
  /*                        Prepare Dates From Backend                           */
  /* -------------------------------------------------------------------------- */

  const availableDates = useMemo(() => {
    return days.map((day) => ({
      ...day,

      dateObj:
  day.date instanceof Date
    ? new Date(day.date)
    : new Date(day.date),

      hasSlots:
        Array.isArray(day.slots) &&
        day.slots.some((slot) => slot.available),
    }));
  }, [days]);

  /* -------------------------------------------------------------------------- */
  /*                            Calendar Generation                             */
  /* -------------------------------------------------------------------------- */

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);

    const monthEnd = endOfMonth(currentMonth);

    const calendarStart = startOfWeek(monthStart, {
      weekStartsOn: 1,
    });

    const calendarEnd = endOfWeek(monthEnd, {
      weekStartsOn: 1,
    });

    return eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });
  }, [currentMonth]);

  /* -------------------------------------------------------------------------- */
  /*                     Auto Select First Available Day                         */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (selectedDate) return;

    const firstAvailable = availableDates.find(
      (day) => day.hasSlots,
    );

    if (firstAvailable) {
      setSelectedDate(new Date(firstAvailable.date));
    }
  }, [availableDates, selectedDate]);

  /* -------------------------------------------------------------------------- */
  /*                         Currently Selected Day                             */
  /* -------------------------------------------------------------------------- */

  const currentDay = useMemo(() => {
    if (!selectedDate) return null;

    return (
      availableDates.find((day) =>
        isSameDay(day.dateObj, new Date(selectedDate)),
      ) ?? null
    );
  }, [availableDates, selectedDate]);

  /* -------------------------------------------------------------------------- */
  /*                            Month Navigation                                */
  /* -------------------------------------------------------------------------- */

  function previousMonth() {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }

  function nextMonth() {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }

  /* -------------------------------------------------------------------------- */
  /*                           Select Calendar Date                             */
  /* -------------------------------------------------------------------------- */

  function handleDateClick(dayData) {
    if (!dayData || !dayData.hasSlots) return;

    setSelectedDate(new Date(dayData.date));

    setSelectedSlot(null);
  }

  /* -------------------------------------------------------------------------- */
  /*                              Select Slot                                   */
  /* -------------------------------------------------------------------------- */

  function handleSlotClick(slot) {
    if (!slot?.available || !currentDay) return;

    setSelectedSlot({
      id: `${currentDay.date}-${slot.startTime}`,
      appointmentDate: new Date(currentDay.date),

      startTime: slot.startTime,
      endTime: slot.endTime,

      displayStartTime: slot.displayStartTime,
      displayEndTime: slot.displayEndTime,

      durationMinutes: slot.durationMinutes,

      timezone: currentDay.timezone,
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                           Continue Booking                                 */
  /* -------------------------------------------------------------------------- */

  async function handleContinue() {
    if (!selectedSlot) return;

    setLoading(true);

    try {
      await onSelectSlot(selectedSlot);
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                              JSX Starts Here                               */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6">

  {/* ====================================================================== */}
  {/* Calendar */}
  {/* ====================================================================== */}

  <Card>
    <CardContent className="p-6">

      {/* Header */}

      <div className="mb-6 flex items-center justify-between">

        <Button
          variant="outline"
          size="icon"
          onClick={previousMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="text-xl font-bold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>

        <Button
          variant="outline"
          size="icon"
          onClick={nextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

      </div>

      {/* Weekdays */}

      <div className="mb-3 grid grid-cols-7 gap-2">

        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-muted-foreground"
          >
            {day}
          </div>
        ))}

      </div>

      {/* Calendar */}

      <div className="grid grid-cols-7 gap-2">

        {calendarDays.map((date) => {

          const dayData = availableDates.find((d) =>
            isSameDay(d.dateObj, date)
          );

          const hasSlots = dayData?.hasSlots ?? false;

          const selected =
            selectedDate &&
isSameDay(date, selectedDate)

          return (

            <button
              key={date.getTime()}
              type="button"
              disabled={!hasSlots}
              onClick={() => handleDateClick(dayData)}
              className={`
                relative
                aspect-square
                rounded-xl
                border
                transition-all
                duration-200

                ${
                  !isSameMonth(date, currentMonth)
                    ? "opacity-30"
                    : ""
                }

                ${
                  selected
                    ? "border-emerald-600 bg-emerald-100 dark:bg-emerald-900"
                    : hasSlots
                    ? "hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                    : "cursor-not-allowed bg-muted/30"
                }
              `}
            >

              <div className="flex h-full flex-col items-center justify-center">

                <span
                  className={`
                    text-sm font-medium

                    ${
                      isToday(date)
                        ? "text-red-500"
                        : ""
                    }
                  `}
                >
                  {format(date, "d")}
                </span>

                {hasSlots && (
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                )}

              </div>

            </button>

          );

        })}

      </div>

      {/* Legend */}

      <div className="mt-6 flex flex-wrap gap-5 text-sm">

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          Available
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-emerald-600 bg-emerald-100 dark:bg-emerald-900" />
          Selected
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          Today
        </div>

      </div>

    </CardContent>
  </Card>

  {/* ====================================================================== */}
  {/* Selected Day */}
  {/* ====================================================================== */}

  {currentDay && (

    <Card>

      <CardContent className="flex items-center gap-4 p-5">

        <CalendarDays className="h-6 w-6 text-emerald-500" />

        <div>

          <h3 className="font-semibold">

            {format(
    currentDay.date,
    "EEEE, dd MMMM yyyy"
)}

          </h3>

          <p className="text-sm text-muted-foreground">

            {currentDay.slots.filter((slot) => slot.available).length}
            {" "}
            slots available

          </p>

        </div>

      </CardContent>

    </Card>

  )}

  {/* ====================================================================== */}
  {/* Time Slots */}
  {/* ====================================================================== */}

  {currentDay && (
  <>
    {currentDay.slots.length === 0 ? (
      <Card>
        <CardContent className="py-12 text-center">

          <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />

          <h3 className="text-lg font-semibold">
            No Slots Available
          </h3>

          <p className="mt-2 text-muted-foreground">
            This doctor has no available consultation slots for this day.
          </p>

        </CardContent>
      </Card>
    ) : (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">

        {currentDay.slots.map((slot) => {

          const selected =
            selectedSlot?.startTime === slot.startTime;

          return (
            <Card
              key={slot.startTime}
              onClick={() => handleSlotClick(slot)}
              className={`
                cursor-pointer
                transition-all
                duration-200

                ${
                  !slot.available
                    ? "cursor-not-allowed opacity-50"
                    : "hover:border-emerald-500 hover:shadow-md"
                }

                ${
                  selected
                    ? "border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
                    : ""
                }
              `}
            >
              <CardContent className="p-4">

                <div className="flex flex-col items-center text-center">

                  <Clock className="mb-3 h-6 w-6 text-emerald-500" />

                  <h3 className="text-base font-semibold">

                    {slot.displayStartTime}

                  </h3>

                  <p className="text-sm text-muted-foreground">

                    to

                  </p>

                  <h4 className="font-medium">

                    {slot.displayEndTime}

                  </h4>

                  <div className="mt-3 text-xs text-muted-foreground">

                    {slot.durationMinutes} Minutes

                  </div>

                  <div className="mt-4">

                    {slot.available ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                        Available
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
                        Booked
                      </span>
                    )}

                  </div>

                </div>

              </CardContent>
            </Card>
          );
        })}

      </div>
    )}
  </>
)}
    {/* ====================================================================== */}
    {/* Selected Appointment Summary */}
    {/* ====================================================================== */}

    {selectedSlot && (
      <Card className="border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30">
        <CardContent className="p-6">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <p className="text-sm text-muted-foreground">
                Selected Appointment
              </p>

              <h2 className="mt-1 text-xl font-bold">

                {format(
    selectedSlot.appointmentDate,
    "EEEE, dd MMM yyyy"
)}

              </h2>

              <div className="mt-3 flex items-center gap-2">

                <Clock className="h-5 w-5 text-emerald-500" />

                <span className="font-medium">

                  {selectedSlot.displayStartTime}
                  {" - "}
                  {selectedSlot.displayEndTime}

                </span>

              </div>

              <p className="mt-2 text-sm text-muted-foreground">

                Duration :
                {" "}
                {selectedSlot.durationMinutes}
                {" "}
                minutes

              </p>

              <p className="mt-1 text-sm text-muted-foreground">

                Timezone :
                {" "}
                {selectedSlot.timezone}

              </p>

            </div>

            <Button
              size="lg"
              disabled={loading}
              onClick={handleContinue}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                "Booking Appointment..."
              ) : (
                <>
                  Continue Booking
                  <ChevronRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

          </div>

        </CardContent>
      </Card>
    )}

    {/* ====================================================================== */}
    {/* Empty Footer */}
    {/* ====================================================================== */}

    {!selectedSlot && currentDay && currentDay.slots.length > 0 && (

      <Card className="border-dashed">

        <CardContent className="flex items-center justify-center py-8">

          <p className="text-sm text-muted-foreground">

            👆 Select any available slot to continue booking.

          </p>

        </CardContent>

      </Card>

    )}

  </div>
);
}