"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  User,
  Calendar,
  Medal,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { SlotPicker } from "./slot-picker";
import { AppointmentForm } from "./appointment-form";

export function DoctorProfile({
  doctor,
  availableDays,
}) {
  const router = useRouter();

  const [showBooking, setShowBooking] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState(null);

  

  function toggleBooking() {
    setShowBooking((previous) => !previous);

    if (!showBooking) {
      setTimeout(() => {
        document.getElementById("booking-section")?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);
    }
  }

  function handleSlotSelect(slot) {
    setSelectedSlot(slot);
  }

  function handleBookingComplete() {
    router.push("/appointments");
  }
  // console.log("Available Days:", availableDays);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* ========================================================= */}
      {/* Left Sidebar                                              */}
      {/* ========================================================= */}

      <div className="md:col-span-1">
        <div className="md:sticky md:top-24">
          <Card className="border-emerald-900/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4 h-32 w-32 overflow-hidden rounded-full bg-emerald-900/20">
                  {doctor.imageUrl ? (
                    <Image
                      src={doctor.imageUrl}
                      alt={doctor.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User className="h-16 w-16 text-emerald-500" />
                    </div>
                  )}
                </div>

                <h2 className="mb-1 text-2xl font-bold">Dr. {doctor.name}</h2>

                <Badge
                  variant="outline"
                  className="mb-4 border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                >
                  {doctor.specialty}
                </Badge>

                <div className="mb-2 flex items-center gap-2">
                  <Medal className="h-4 w-4 text-emerald-500" />

                  <span className="text-sm text-muted-foreground">
                    {doctor.experience} years experience
                  </span>
                </div>

                <Button
                  onClick={toggleBooking}
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {showBooking ? (
                    <>
                      Hide Booking
                      <ChevronUp className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Book Appointment
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========================================================= */}
      {/* Right Section                                             */}
      {/* ========================================================= */}

      <div className="space-y-6 md:col-span-2">
        <Card className="border-emerald-900/20">
          <CardHeader>
            <CardTitle className="text-2xl">About Dr. {doctor.name}</CardTitle>

            <CardDescription>
              Professional background and consultation details.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" />

                <h3 className="font-semibold">Description</h3>
              </div>

              <p className="whitespace-pre-line text-muted-foreground">
                {doctor.description}
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-500" />

                <h3 className="font-semibold">Appointment Availability</h3>
              </div>

              <p className="text-muted-foreground">
                View this doctor's monthly schedule and choose any available
                consultation date.
              </p>
            </div>
          </CardContent>
        </Card>
        {/* ========================================================= */}
        {/* Booking Section                                           */}
        {/* ========================================================= */}

        {showBooking && (

          <div id="booking-section">
            
            <Card className="border-emerald-900/20">
              <CardHeader>
                <CardTitle className="text-2xl">Book an Appointment</CardTitle>

                <CardDescription>
                  Select a date from the calendar and then choose an available
                  consultation slot.
                </CardDescription>
              </CardHeader>
              
              
              <CardContent className="space-y-6">
                {!selectedSlot && (
                  <>
                    <SlotPicker
                    days={availableDays}
                    onSelectSlot={handleSlotSelect}/>
                  </>
                )}

                {selectedSlot && (
                  <AppointmentForm
                    doctorId={doctor.id}
                    slot={selectedSlot}
                    onBack={() => setSelectedSlot(null)}
                    onComplete={handleBookingComplete}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
