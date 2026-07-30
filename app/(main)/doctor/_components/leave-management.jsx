"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  Calendar,
  CalendarPlus,
  Trash2,
  Loader2,
} from "lucide-react";

import { format } from "date-fns";

import { toast } from "sonner";

import useFetch from "@/hooks/use-fetch";

import {
  getDoctorLeaves,
  createDoctorLeave,
  deleteDoctorLeave,
} from "@/actions/leave";

/* -------------------------------------------------------------------------- */
/*                               Component                                    */
/* -------------------------------------------------------------------------- */

export function LeaveManagement() {
  /**
   * Fetch existing leaves.
   */
  const {
    loading,
    data,
    error,
    fn: loadLeaves,
  } = useFetch(getDoctorLeaves);

  /**
   * Create leave.
   */
  const {
    loading: creating,
    data: createResponse,
    error: createError,
    fn: addLeave,
  } = useFetch(createDoctorLeave);

  /**
   * Delete leave.
   */
  const {
    loading: deleting,
    data: deleteResponse,
    error: deleteError,
    fn: removeLeave,
  } = useFetch(deleteDoctorLeave);

  /**
   * Local state.
   */
  const [leaves, setLeaves] = useState([]);

  const [leaveDate, setLeaveDate] = useState("");

  const [reason, setReason] = useState("");

  const [notes, setNotes] = useState("");

  /**
   * Initial load.
   */
  useEffect(() => {
    loadLeaves();
  }, []);

  /**
   * Populate state.
   */
  useEffect(() => {
    if (!data?.success) return;

    setLeaves(data.leaves);
  }, [data]);

  /**
   * Toasts.
   */
  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  useEffect(() => {
    if (createError) {
      toast.error(createError.message);
    }
  }, [createError]);

  useEffect(() => {
    if (deleteError) {
      toast.error(deleteError.message);
    }
  }, [deleteError]);
    /**
   * ------------------------------------------------------------------------
   * Create Leave
   * ------------------------------------------------------------------------
   */

  async function handleCreateLeave() {
    if (!leaveDate) {
      toast.error("Please select a leave date.");
      return;
    }

    await addLeave({
      leaveDate,
      reason,
      notes,
    });
  }

  /**
   * ------------------------------------------------------------------------
   * Delete Leave
   * ------------------------------------------------------------------------
   */

  async function handleDeleteLeave(id) {
    await removeLeave(id);
  }

  /**
   * ------------------------------------------------------------------------
   * Refresh after changes
   * ------------------------------------------------------------------------
   */

  useEffect(() => {
    if (!createResponse?.success) return;

    toast.success(createResponse.message);

    setLeaveDate("");
    setReason("");
    setNotes("");

    loadLeaves();
  }, [createResponse]);

  useEffect(() => {
    if (!deleteResponse?.success) return;

    toast.success(deleteResponse.message);

    loadLeaves();
  }, [deleteResponse]);

  /* ---------------------------------------------------------------------- */
  /* Loading State                                                          */
  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-emerald-500" />
          Doctor Leave Management
        </CardTitle>

        <CardDescription>
          Add leave dates when you won't be available for appointments.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">

        {/* ------------------------------------------------------------ */}
        {/* Add Leave Form                                               */}
        {/* ------------------------------------------------------------ */}

        <div className="space-y-4 rounded-lg border p-5">

          <div className="grid gap-4 md:grid-cols-2">

            <div className="space-y-2">
              <Label>Leave Date</Label>

              <Input
                type="date"
                value={leaveDate}
                onChange={(e) => setLeaveDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>

              <Input
                placeholder="Vacation"
                maxLength={100}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

          </div>

          <div className="space-y-2">
            <Label>Notes</Label>

            <Textarea
              rows={4}
              maxLength={500}
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button
            onClick={handleCreateLeave}
            disabled={creating}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Add Leave
              </>
            )}
          </Button>

        </div>
                {/* ------------------------------------------------------------ */}
        {/* Existing Leaves                                              */}
        {/* ------------------------------------------------------------ */}

        <div className="space-y-4">

          <div>
            <h3 className="text-lg font-semibold">
              Upcoming Leave Dates
            </h3>

            <p className="text-sm text-muted-foreground">
              Patients will not be able to book appointments on these dates.
            </p>
          </div>

          {leaves.length === 0 ? (

            <div className="rounded-lg border border-dashed p-8 text-center">

              <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />

              <h4 className="font-medium">
                No Leave Added
              </h4>

              <p className="mt-2 text-sm text-muted-foreground">
                You haven't scheduled any leave yet.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {leaves.map((leave) => (

                <Card
                  key={leave.id}
                  className="border-muted"
                >
                  <CardContent className="flex items-center justify-between p-5">

                    <div className="space-y-2">

                      <div className="flex items-center gap-2">

                        <Calendar className="h-4 w-4 text-emerald-500" />

                        <span className="font-semibold">
                          {format(
                            new Date(leave.leaveDate),
                            "EEEE, dd MMMM yyyy"
                          )}
                        </span>

                      </div>

                      {leave.reason && (
                        <p className="text-sm font-medium">
                          {leave.reason}
                        </p>
                      )}

                      {leave.notes && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {leave.notes}
                        </p>
                      )}

                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deleting}
                      onClick={() =>
                        handleDeleteLeave(leave.id)
                      }
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </>
                      )}
                    </Button>

                  </CardContent>
                </Card>

              ))}

            </div>

          )}

        </div>

      </CardContent>
    </Card>
  );
}
/**
 * Validate one break.
 */
function validateBreak(schedule, doctorBreak) {
  if (!doctorBreak.startTime || !doctorBreak.endTime) {
    throw new Error(
      `${schedule.weekday}: Break start and end time are required.`,
    );
  }

  if (doctorBreak.startTime >= doctorBreak.endTime) {
    throw new Error(
      `${schedule.weekday}: Break end time must be after start time.`,
    );
  }

  if (
    doctorBreak.startTime < schedule.startTime ||
    doctorBreak.endTime > schedule.endTime
  ) {
    throw new Error(
      `${schedule.weekday}: Break must be inside working hours.`,
    );
  }
}

/**
 * Ensure breaks don't overlap.
 */
function validateBreakOverlaps(schedule) {
  const breaks = [...(schedule.breaks ?? [])].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );

  for (let i = 1; i < breaks.length; i++) {
    const previous = breaks[i - 1];
    const current = breaks[i];

    if (previous.endTime > current.startTime) {
      throw new Error(
        `${schedule.weekday}: Breaks cannot overlap.`,
      );
    }
  }
}