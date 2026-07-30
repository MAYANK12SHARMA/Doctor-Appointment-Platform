"use client";

import { FlaskConical, Copy, Shield, Stethoscope, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";

const PASSWORD = "Asegsdvs@1234rqSDF";
const OTP = "424242";

const doctors = Array.from({ length: 48 }, (_, i) => ({
  email: `doctor${String(i + 1).padStart(2, "0")}+clerk_test@example.com`,
}));

const patients = Array.from({ length: 20 }, (_, i) => ({
  email: `patient${String(i + 1).padStart(2, "0")}@gmail.com`,
}));

export default function DemoAccountsSheet() {
  const copy = async (text) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FlaskConical className="h-4 w-4" />
          Demo Accounts
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[700px] sm:max-w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Demo Accounts</SheetTitle>
          <SheetDescription>
            Use these credentials for testing the application.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-10 mt-6">

          {/* ADMIN */}

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-red-500" />
              <h2 className="font-semibold text-lg">Admin</h2>
            </div>

            <table className="w-full border rounded-lg overflow-hidden">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3">Email</th>
                  <th>Password</th>
                  <th>OTP</th>
                </tr>
              </thead>

              <tbody>
                <tr className="border-t">
                  <td className="p-3">
                    admin+clerk_test@example.com
                  </td>

                  <td className="text-center">
                    {PASSWORD}
                  </td>

                  <td className="text-center">
                    {OTP}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* DOCTORS */}

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold text-lg">
                Doctors ({doctors.length})
              </h2>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-3">Email</th>
                    <th>Password</th>
                    <th>OTP</th>
                  </tr>
                </thead>

                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.email} className="border-t">
                      <td className="p-3">{doctor.email}</td>
                      <td className="text-center">{PASSWORD}</td>
                      <td className="text-center">{OTP}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* PATIENTS */}

          <section>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-green-500" />
              <h2 className="font-semibold text-lg">
                Patients ({patients.length})
              </h2>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Email</th>
                    <th>Password</th>
                    <th>OTP</th>
                  </tr>
                </thead>

                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.email} className="border-t">
                      <td className="p-3">{patient.email}</td>
                      <td className="text-center">{PASSWORD}</td>
                      <td className="text-center">{OTP}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="font-medium mb-2">Notes</p>

            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>All accounts share the same password.</li>
              <li>OTP for every account is <strong>424242</strong>.</li>
              <li>These accounts are intended for testing only.</li>
            </ul>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}