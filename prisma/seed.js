/* ============================================================
   Healthcare Platform Seeder
   ------------------------------------------------------------
   Version : Production Seeder
   Database: PostgreSQL + Prisma
   Auth    : Clerk
   ============================================================ */

import { PrismaClient } from "@prisma/client";
import { createClerkClient } from "@clerk/backend";

/* ============================================================
   Prisma
============================================================ */

let prisma = new PrismaClient();

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/* ============================================================
   Configuration
============================================================ */

const DEFAULT_PASSWORD = "Asegsdvs@1234rqSDF";

const TIMEZONE = "Asia/Kolkata";

const CONSULTATION_DURATIONS = [20, 30, 45];

const DOCTORS_PER_SPECIALTY = 3;

const TOTAL_PATIENTS = 20;

const TOTAL_APPOINTMENTS = 50;

const APPOINTMENT_COST = 2;

const PLATFORM_FEE_PER_CREDIT = 2;

const CREDIT_VALUE = 10;

const INITIAL_PATIENT_CREDITS = [20, 40, 60, 100];

const SEED_START_DATE = new Date("2026-08-10");

const SEED_END_DATE = new Date("2026-08-30");

/* ============================================================
   Frontend Specialties
============================================================ */

const SPECIALTIES = [
  "General Medicine",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Neurology",
  "Obstetrics & Gynecology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Urology",
  "Other",
];

/* ============================================================
   Admin Account
============================================================ */

const ADMIN = {
  email: "admin+clerk_test@example.com",
  password: DEFAULT_PASSWORD,
  firstName: "System",
  lastName: "Admin",
  role: "ADMIN",
};

/* ============================================================
   Weekdays
============================================================ */

const WEEKDAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

/* ============================================================
   Doctor Schedule
============================================================ */

const WORKING_HOURS = {
  start: "09:00",
  end: "17:00",
};

const BREAKS = [
  {
    title: "Lunch Break",
    start: "13:00",
    end: "13:30",
  },
  {
    title: "Tea Break",
    start: "15:30",
    end: "15:45",
  },
];

/* ============================================================
   Appointment Status Distribution
============================================================ */

const APPOINTMENT_STATUS = {
  COMPLETED: 0.60,
  SCHEDULED: 0.30,
  CANCELLED: 0.10,
};

/* ============================================================
   Leave Reasons
============================================================ */

const LEAVE_REASONS = [
  "Medical Conference",
  "Annual Leave",
  "Health Checkup",
  "Family Function",
  "Emergency Leave",
  "Personal Leave",
];

/* ============================================================
   Consultation Notes
============================================================ */

const CONSULTATION_NOTES = [
  "Routine health checkup.",
  "Follow-up consultation.",
  "Medication review.",
  "Blood pressure evaluation.",
  "Diabetes management.",
  "Fever and infection assessment.",
  "Allergy consultation.",
  "Post-operative review.",
  "Skin condition evaluation.",
  "Neurological examination.",
];

/* ============================================================
   Seeder Statistics
============================================================ */

const STATS = {
  admin: 0,
  doctors: 0,
  patients: 0,
  schedules: 0,
  breaks: 0,
  leaves: 0,
  appointments: 0,
  transactions: 0,
  payouts: 0,
};
/* ============================================================
   Name Dataset
============================================================ */

const FIRST_NAMES = [
  "Aarav",
  "Vivaan",
  "Aditya",
  "Vihaan",
  "Arjun",
  "Krishna",
  "Rahul",
  "Rohan",
  "Amit",
  "Akash",
  "Ankit",
  "Nikhil",
  "Harsh",
  "Yash",
  "Karan",
  "Abhishek",
  "Mayank",
  "Mohit",
  "Siddharth",
  "Ayush",
  "Priya",
  "Ananya",
  "Sneha",
  "Riya",
  "Neha",
  "Kavya",
  "Aisha",
  "Ishita",
  "Pooja",
  "Tanvi",
  "Megha",
  "Simran",
  "Nandini",
  "Shruti",
  "Muskan",
  "Anjali",
  "Divya",
  "Sakshi",
  "Khushi",
  "Palak",
];

const LAST_NAMES = [
  "Sharma",
  "Verma",
  "Gupta",
  "Singh",
  "Kapoor",
  "Agarwal",
  "Mehta",
  "Malhotra",
  "Khanna",
  "Jain",
  "Arora",
  "Bansal",
  "Pandey",
  "Yadav",
  "Chauhan",
  "Mishra",
  "Joshi",
  "Srivastava",
  "Saxena",
  "Tiwari",
  "Kulkarni",
  "Patel",
  "Naidu",
  "Reddy",
  "Das",
  "Roy",
  "Bose",
  "Mukherjee",
  "Ghosh",
  "Sinha",
];

/* ============================================================
   Utility Helpers
============================================================ */

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBoolean(chance = 0.5) {
  return Math.random() < chance;
}

function pad(number) {
  return String(number).padStart(2, "0");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ============================================================
   Date Helpers
============================================================ */

function cloneDate(date) {
  return new Date(date);
}

function normalizeDate(date) {
  const value = new Date(date);

  value.setHours(0, 0, 0, 0);

  return value;
}

function addDays(date, days) {
  const value = cloneDate(date);

  value.setDate(value.getDate() + days);

  return value;
}

function addMinutes(date, minutes) {
  const value = cloneDate(date);

  value.setMinutes(value.getMinutes() + minutes);

  return value;
}

function combineDateAndTime(date, time) {
  const [hour, minute] = time.split(":").map(Number);

  const value = cloneDate(date);

  value.setHours(hour);
  value.setMinutes(minute);
  value.setSeconds(0);
  value.setMilliseconds(0);

  return value;
}

function getRandomDate(start, end) {
  const startTime = start.getTime();
  const endTime = end.getTime();

  const random = randomInt(startTime, endTime);

  return normalizeDate(new Date(random));
}

/* ============================================================
   Logging Helpers
============================================================ */

function section(title) {
  console.log("");
  console.log("=".repeat(70));
  console.log(title);
  console.log("=".repeat(70));
}

function info(message) {
  console.log(`ℹ️  ${message}`);
}

function success(message) {
  console.log(`✅ ${message}`);
}

function warning(message) {
  console.log(`⚠️  ${message}`);
}

function error(message) {
  console.log(`❌ ${message}`);
}

/* ============================================================
   Doctor Generator
============================================================ */

function generateDoctors() {
  const doctors = [];

  let counter = 1;

  for (const specialty of SPECIALTIES) {
    for (let i = 0; i < DOCTORS_PER_SPECIALTY; i++) {
      const firstName = randomItem(FIRST_NAMES);
      const lastName = randomItem(LAST_NAMES);

      doctors.push({
        email: `doctor${pad(counter)}+clerk_test@example.com`,

        password: DEFAULT_PASSWORD,

        firstName,

        lastName,

        specialty,

        experience: randomInt(3, 30),

        consultationDuration: randomItem(
          CONSULTATION_DURATIONS
        ),

        description:
          `Dr. ${firstName} ${lastName} is an experienced ` +
          `${specialty} specialist with over ` +
          `${randomInt(3, 30)} years of clinical experience.`,
      });

      counter++;
    }
  }

  return doctors;
}

/* ============================================================
   Patient Generator
============================================================ */

function generatePatients() {
  const patients = [];

  for (let i = 1; i <= TOTAL_PATIENTS; i++) {
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);

    patients.push({
      email: `patient${pad(i)}+clerk_test@example.com`,

      password: DEFAULT_PASSWORD,

      firstName,

      lastName,

      initialCredits: randomItem(
        INITIAL_PATIENT_CREDITS
      ),
    });
  }

  return patients;
}

/* ============================================================
   Generated Data
============================================================ */

const USERS = {
  admin: ADMIN,
  doctors: generateDoctors(),
  patients: generatePatients(),
};

success(
  `Prepared ${USERS.doctors.length} doctors and ${USERS.patients.length} patients.`
);
/* ============================================================
   Clerk Helper Functions
============================================================ */

async function findClerkUserByEmail(email) {
  const response = await clerk.users.getUserList({
    emailAddress: [email],
  });

  return response.data[0] ?? null;
}

async function deleteClerkUserIfExists(email) {
  const existing = await findClerkUserByEmail(email);

  if (!existing) return;

  info(`Deleting Clerk User -> ${email}`);

  await clerk.users.deleteUser(existing.id);
}

async function createClerkUser(user) {
  info(`Creating Clerk User -> ${user.email}`);

  return clerk.users.createUser({
    emailAddress: [user.email],

    password: user.password,

    firstName: user.firstName,

    lastName: user.lastName,

    skipPasswordChecks: true,
  });
}

/* ============================================================
   Prisma User Creation
============================================================ */

async function createPrismaUser(clerkUser, user) {
  const isDoctor = user.role === "DOCTOR";
  const isPatient = user.role === "PATIENT";

  return prisma.user.create({
    data: {
      clerkUserId: clerkUser.id,

      email: clerkUser.emailAddresses[0].emailAddress,

      name: `${user.firstName} ${user.lastName}`,

      imageUrl: clerkUser.imageUrl,

      role: user.role,

      /* ---------------- Doctor ---------------- */

      specialty: isDoctor ? user.specialty : null,

      experience: isDoctor ? user.experience : null,

      credentialUrl: isDoctor
        ? `https://verification.healthcare.com/${user.firstName.toLowerCase()}-${user.lastName.toLowerCase()}.pdf`
        : null,

      description: isDoctor ? user.description : null,

      verificationStatus: isDoctor
        ? "VERIFIED"
        : null,

      consultationDuration: isDoctor
        ? user.consultationDuration
        : 30,

      timezone: TIMEZONE,

      /* ---------------- Patient ---------------- */

      credits: isPatient
        ? user.initialCredits
        : 0,
    },
  });
}

/* ============================================================
   Database Cleanup
============================================================ */

async function cleanDatabase() {
  section("Cleaning Database");

  await prisma.payout.deleteMany();

  await prisma.creditTransaction.deleteMany();

  await prisma.appointment.deleteMany();

  await prisma.doctorBreak.deleteMany();

  await prisma.doctorLeave.deleteMany();

  await prisma.doctorSchedule.deleteMany();

  await prisma.user.deleteMany();

  success("Database cleaned.");
}

/* ============================================================
   Clerk Cleanup
============================================================ */

async function cleanClerkUsers() {
  section("Cleaning Clerk");

  await deleteClerkUserIfExists(USERS.admin.email);

  for (const doctor of USERS.doctors) {
    await deleteClerkUserIfExists(doctor.email);
  }

  for (const patient of USERS.patients) {
    await deleteClerkUserIfExists(patient.email);
  }

  success("Clerk cleanup completed.");
}

/* ============================================================
   User Creation
============================================================ */

async function createUsers() {
  section("Creating Users");

  /* ---------------- Admin ---------------- */

  info("Creating Admin");

  const adminClerk = await createClerkUser(
    USERS.admin
  );

  const admin = await createPrismaUser(
    adminClerk,
    {
      ...USERS.admin,
      role: "ADMIN",
    }
  );

  STATS.admin++;

  success("Admin Created");

  await sleep(250);

  /* ---------------- Doctors ---------------- */

  const doctors = [];

  info("Creating Doctors");

  for (const doctor of USERS.doctors) {
    const clerkUser = await createClerkUser(
      doctor
    );

    const prismaDoctor =
      await createPrismaUser(clerkUser, {
        ...doctor,
        role: "DOCTOR",
      });

    doctors.push(prismaDoctor);

    STATS.doctors++;

    await sleep(80);
  }

  success(`${doctors.length} Doctors Created`);

  /* ---------------- Patients ---------------- */

  const patients = [];

  info("Creating Patients");

  for (const patient of USERS.patients) {
    const clerkUser = await createClerkUser(
      patient
    );

    const prismaPatient =
      await createPrismaUser(clerkUser, {
        ...patient,
        role: "PATIENT",
      });

    patients.push(prismaPatient);

    STATS.patients++;

    await sleep(80);
  }

  success(`${patients.length} Patients Created`);

  return {
    admin,
    doctors,
    patients,
  };
}

/* ============================================================
   Summary
============================================================ */

function printUserSummary(users) {
  section("User Summary");

  console.log("");

  console.log(
    `Admin    : ${users.admin.email}`
  );

  console.log(
    `Doctors  : ${users.doctors.length}`
  );

  console.log(
    `Patients : ${users.patients.length}`
  );

  console.log("");

  console.log(
    "Sample Doctors"
  );

  console.log("-----------------------");

  users.doctors
    .slice(0, 10)
    .forEach((doctor) => {
      console.log(
        `${doctor.name} | ${doctor.specialty}`
      );
    });

  console.log("");

  console.log(
    "Sample Patients"
  );

  console.log("-----------------------");

  users.patients
    .slice(0, 10)
    .forEach((patient) => {
      console.log(patient.name);
    });

  console.log("");
}
/* ============================================================
   Schedule Date Helpers
============================================================ */

function getDatesBetween(startDate, endDate) {
  const dates = [];

  const current = new Date(startDate);

  current.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    dates.push(new Date(current));

    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function getWeekday(date) {
  const weekday = WEEKDAYS[date.getDay()];

  return weekday;
}

function isWorkingDay(date) {
  return getWeekday(date) !== "SUNDAY";
}

/* ============================================================
   Doctor Schedule Generation
============================================================ */
async function createDoctorSchedules(doctors) {
  section("Creating Doctor Schedules");

  const allSchedules = [];

  const dates = getDatesBetween(
    SEED_START_DATE,
    SEED_END_DATE
  );

  info(
    `Available Dates: ${dates.length}`
  );

  for (const doctor of doctors) {
    info(`Doctor: ${doctor.name}`);

    const doctorSchedules = [];

    // Random number of schedules (1 to 5)
    const totalSchedules = randomInt(1, 5);

    // Copy dates so we can remove selected ones
    const availableDates = [...dates];

    for (let i = 0; i < totalSchedules; i++) {
      if (!availableDates.length) break;

      // Pick a random date
      const index = randomInt(0, availableDates.length - 1);
      const date = availableDates.splice(index, 1)[0];

      const available = isWorkingDay(date);

      const schedule = await prisma.doctorSchedule.create({
        data: {
          doctorId: doctor.id,

          weekday: getWeekday(date),

          scheduleDate: date,

          startTime: available
            ? WORKING_HOURS.start
            : "",

          endTime: available
            ? WORKING_HOURS.end
            : "",

          slotDuration: doctor.consultationDuration,

          timezone: TIMEZONE,

          isAvailable: available,
        },
      });

      doctorSchedules.push(schedule);
      allSchedules.push(schedule);
      STATS.schedules++;
    }

    success(
      `${doctor.name} -> ${doctorSchedules.length} schedules`
    );
  }

  console.log("");

  success(
    `${allSchedules.length} schedules created`
  );

  return allSchedules;
}
/* ============================================================
   Schedule Verification
============================================================ */

async function verifySchedules() {
  section("Verifying Schedules");

  const total = await prisma.doctorSchedule.count();

  const available =
    await prisma.doctorSchedule.count({
      where: {
        isAvailable: true,
      },
    });

  const unavailable =
    await prisma.doctorSchedule.count({
      where: {
        isAvailable: false,
      },
    });

  console.log("");

  console.log(
    `Total Schedules     : ${total}`
  );

  console.log(
    `Available Schedules : ${available}`
  );

  console.log(
    `Sunday Off          : ${unavailable}`
  );

  console.log("");
}
/* ============================================================
   Doctor Breaks
============================================================ */

async function createDoctorBreaks(schedules) {
  section("Creating Doctor Breaks");

  const breaks = [];

  for (const schedule of schedules) {
    if (!schedule.isAvailable) {
      continue;
    }

    /* ---------------- Lunch ---------------- */

    const lunch = await prisma.doctorBreak.create({
      data: {
        scheduleId: schedule.id,

        title: "Lunch Break",

        startTime: "13:00",

        endTime: "13:30",
      },
    });

    breaks.push(lunch);

    STATS.breaks++;

    /* ---------------- Tea Break ---------------- */

    const teaBreakRequired = Math.random() < 0.85;

    if (teaBreakRequired) {
      const tea = await prisma.doctorBreak.create({
        data: {
          scheduleId: schedule.id,

          title: "Tea Break",

          startTime: "15:30",

          endTime: "15:45",
        },
      });

      breaks.push(tea);

      STATS.breaks++;
    }
  }

  success(`${breaks.length} breaks created`);

  return breaks;
}

/* ============================================================
   Doctor Leaves
============================================================ */

async function createDoctorLeaves(doctors) {
  section("Creating Doctor Leaves");

  const leaves = [];

  for (const doctor of doctors) {
    const totalLeaves = randomInt(2, 4);

    const usedDates = new Set();

    let created = 0;

    while (created < totalLeaves) {
      const leaveDate = getRandomDate(
        SEED_START_DATE,
        SEED_END_DATE
      );

      if (!isWorkingDay(leaveDate)) {
        continue;
      }

      const key = leaveDate.toISOString().split("T")[0];

      if (usedDates.has(key)) {
        continue;
      }

      usedDates.add(key);

      const leave = await prisma.doctorLeave.create({
        data: {
          doctorId: doctor.id,

          leaveDate,

          reason: randomItem(LEAVE_REASONS),
        },
      });

      leaves.push(leave);

      STATS.leaves++;

      created++;
    }
  }

  success(`${leaves.length} doctor leaves created`);

  return leaves;
}

/* ============================================================
   Verification
============================================================ */

async function verifyDoctorAvailability() {
  section("Doctor Schedule Summary");

  const totalSchedules =
    await prisma.doctorSchedule.count();

  const availableSchedules =
    await prisma.doctorSchedule.count({
      where: {
        isAvailable: true,
      },
    });

  const totalBreaks =
    await prisma.doctorBreak.count();

  const totalLeaves =
    await prisma.doctorLeave.count();

  console.log("");

  console.log(
    `Schedules : ${totalSchedules}`
  );

  console.log(
    `Available : ${availableSchedules}`
  );

  console.log(
    `Breaks    : ${totalBreaks}`
  );

  console.log(
    `Leaves    : ${totalLeaves}`
  );

  console.log("");
}
/* ============================================================
   Appointment Slot Helpers
============================================================ */

function timeStringToMinutes(time) {
  const [hour, minute] = time.split(":").map(Number);

  return hour * 60 + minute;
}

function minutesToTimeString(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return `${pad(hour)}:${pad(minute)}`;
}

function rangesOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

/* ============================================================
   Generate Slots For One Schedule
============================================================ */

function generateTimeSlots(schedule, breaks = []) {
  const slots = [];

  if (!schedule.isAvailable) {
    return slots;
  }

  const slotDuration =
    schedule.slotDuration ??
    schedule.consultationDuration ??
    30;

  const dayStart = timeStringToMinutes(schedule.startTime);
  const dayEnd = timeStringToMinutes(schedule.endTime);

  let current = dayStart;

  while (current + slotDuration <= dayEnd) {
    const slotStart = current;
    const slotEnd = current + slotDuration;

    const blocked = breaks.some((item) => {
      const breakStart = timeStringToMinutes(
        item.startTime
      );

      const breakEnd = timeStringToMinutes(
        item.endTime
      );

      return rangesOverlap(
        slotStart,
        slotEnd,
        breakStart,
        breakEnd
      );
    });

    if (!blocked) {
      slots.push({
        start: minutesToTimeString(slotStart),
        end: minutesToTimeString(slotEnd),
      });
    }

    current += slotDuration;
  }

  return slots;
}

/* ============================================================
   Existing Appointment Check
============================================================ */

async function slotAlreadyBooked(
  doctorId,
  appointmentDate,
  startTime
) {
  const existing =
    await prisma.appointment.findFirst({
      where: {
        doctorId,

        appointmentDate,

        startTime,
      },
    });

  return existing !== null;
}

/* ============================================================
   Available Slot Finder
============================================================ */

async function getAvailableSlots(schedule) {
  if (!schedule.isAvailable) {
    return [];
  }

  const breaks =
    await prisma.doctorBreak.findMany({
      where: {
        scheduleId: schedule.id,
      },
    });

  const slots = generateTimeSlots(
    schedule,
    breaks
  );

  const available = [];

  for (const slot of slots) {
    const startTime =
      combineDateAndTime(
        schedule.scheduleDate,
        slot.start
      );

    const booked =
      await slotAlreadyBooked(
        schedule.doctorId,
        schedule.scheduleDate,
        startTime
      );

    if (!booked) {
      available.push({
        startTime,
        endTime: combineDateAndTime(
          schedule.scheduleDate,
          slot.end
        ),
      });
    }
  }

  return available;
}

/* ============================================================
   Pick Random Schedule
============================================================ */

async function getRandomWorkingSchedule(
  doctorId
) {
  const schedules =
    await prisma.doctorSchedule.findMany({
      where: {
        doctorId,

        isAvailable: true,
      },
    });

  if (!schedules.length) {
    return null;
  }

  while (schedules.length) {
    const schedule =
      randomItem(schedules);

    const leave =
      await prisma.doctorLeave.findFirst({
        where: {
          doctorId,

          leaveDate:
            schedule.scheduleDate,
        },
      });

    if (!leave) {
      return schedule;
    }

    schedules.splice(
      schedules.indexOf(schedule),
      1
    );
  }

  return null;
}

/* ============================================================
   Random Appointment Status
============================================================ */

function getRandomAppointmentStatus() {
  const value = Math.random();

  if (value < 0.60) {
    return "COMPLETED";
  }

  if (value < 0.90) {
    return "SCHEDULED";
  }

  return "CANCELLED";
}

/* ============================================================
   Random Consultation Note
============================================================ */

function getRandomConsultationNote() {
  return randomItem(
    CONSULTATION_NOTES
  );
}
/* ============================================================
   Appointment Generation
============================================================ */

async function createAppointments(doctors, patients) {
  section("Creating Appointments");

  const appointments = [];

  let attempts = 0;
  const maxAttempts = 5000;

  while (
    appointments.length < TOTAL_APPOINTMENTS &&
    attempts < maxAttempts
  ) {
    attempts++;

    const doctor = randomItem(doctors);
    const patient = randomItem(patients);

    const schedule = await getRandomWorkingSchedule(doctor.id);

    if (!schedule) continue;

    const slots = await getAvailableSlots(schedule);

    if (!slots.length) continue;

    const slot = randomItem(slots);

    const doctorBusy = await prisma.appointment.findFirst({
      where: {
        doctorId: doctor.id,
        appointmentDate: schedule.scheduleDate,
        startTime: slot.startTime,
      },
    });

    if (doctorBusy) continue;

    const patientBusy = await prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        appointmentDate: schedule.scheduleDate,
        startTime: slot.startTime,
      },
    });

    if (patientBusy) continue;

    const status = getRandomAppointmentStatus();

    const appointment = await prisma.appointment.create({
      data: {
        doctorId: doctor.id,
        patientId: patient.id,

        appointmentDate: schedule.scheduleDate,

        startTime: slot.startTime,
        endTime: slot.endTime,

        durationMinutes: doctor.consultationDuration,

        timezone: TIMEZONE,

        status,

        patientDescription: getRandomConsultationNote(),

        notes:
          status === "COMPLETED"
            ? "Consultation completed successfully."
            : null,

        videoSessionId: crypto.randomUUID(),
        videoSessionToken: crypto.randomUUID(),
      },
    });

    appointments.push(appointment);

    STATS.appointments++;

    if (status !== "CANCELLED") {
      await prisma.user.update({
        where: { id: patient.id },
        data: {
          credits: {
            decrement: APPOINTMENT_COST,
          },
        },
      });

      await prisma.user.update({
        where: { id: doctor.id },
        data: {
          credits: {
            increment: APPOINTMENT_COST,
          },
        },
      });
    }

    console.log(
      `✅ ${appointments.length}/${TOTAL_APPOINTMENTS} appointments created`
    );
  }

  success(`${appointments.length} appointments created`);

  return appointments;
}
/* ============================================================
   Appointment Verification
============================================================ */

async function verifyAppointments() {
  section(
    "Appointment Statistics"
  );

  const total =
    await prisma.appointment.count();

  const scheduled =
    await prisma.appointment.count({
      where: {
        status: "SCHEDULED",
      },
    });

  const completed =
    await prisma.appointment.count({
      where: {
        status: "COMPLETED",
      },
    });

  const cancelled =
    await prisma.appointment.count({
      where: {
        status: "CANCELLED",
      },
    });

  console.log("");

  console.log(
    `Total       : ${total}`
  );

  console.log(
    `Completed   : ${completed}`
  );

  console.log(
    `Scheduled   : ${scheduled}`
  );

  console.log(
    `Cancelled   : ${cancelled}`
  );

  console.log("");
}
/* ============================================================
   Credit Transactions
============================================================ */

async function createCreditTransactions(
  doctors,
  patients,
  appointments
) {
  section("Creating Credit Transactions");

  const transactions = [];

  /* ----------------------------------------------------------
     Initial Credit Purchase
  ---------------------------------------------------------- */

  for (const patient of patients) {
    transactions.push({
      userId: patient.id,

      amount: patient.credits,

      type: "CREDIT_PURCHASE",

      packageId: "INITIAL_PACKAGE",
    });
  }

  /* ----------------------------------------------------------
     Appointment Credit Usage
  ---------------------------------------------------------- */

  for (const appointment of appointments) {
    if (appointment.status === "CANCELLED") {
      continue;
    }

    transactions.push({
      userId: appointment.patientId,

      amount: -APPOINTMENT_COST,

      type: "APPOINTMENT_DEDUCTION",

      packageId: appointment.id,
    });

    transactions.push({
      userId: appointment.doctorId,

      amount: APPOINTMENT_COST,

      type: "ADMIN_ADJUSTMENT",

      packageId: appointment.id,
    });
  }

  await prisma.creditTransaction.createMany({
    data: transactions,
  });

  STATS.transactions = transactions.length;

  success(
    `${transactions.length} credit transactions created`
  );

  return transactions;
}

/* ============================================================
   Credit Verification
============================================================ */

async function verifyTransactions() {
  section("Credit Transactions");

  const total =
    await prisma.creditTransaction.count();

  const purchases =
    await prisma.creditTransaction.count({
      where: {
        type: "CREDIT_PURCHASE",
      },
    });

  const deductions =
    await prisma.creditTransaction.count({
      where: {
        type: "APPOINTMENT_DEDUCTION",
      },
    });

  const earnings =
    await prisma.creditTransaction.count({
      where: {
        type: "ADMIN_ADJUSTMENT",
      },
    });

  console.log("");

  console.log(`Total        : ${total}`);

  console.log(`Purchases    : ${purchases}`);

  console.log(`Deductions   : ${deductions}`);

  console.log(`Doctor Earn. : ${earnings}`);

  console.log("");
}

/* ============================================================
   Doctor Payouts
============================================================ */

async function createPayouts(doctors, appointments) {
  section("Creating Doctor Payouts");

  const payouts = [];

  for (const doctor of doctors) {
    const completedAppointments = appointments.filter(
      (appointment) =>
        appointment.doctorId === doctor.id &&
        appointment.status === "COMPLETED"
    );

    if (!completedAppointments.length) {
      continue;
    }

    const credits =
      completedAppointments.length * APPOINTMENT_COST;

    const amount = credits * CREDIT_VALUE;

    const platformFee =
      credits * PLATFORM_FEE_PER_CREDIT;

    const netAmount =
      amount - platformFee;

    const processed = randomBoolean(0.75);

    const payout = await prisma.payout.create({
      data: {
        doctorId: doctor.id,

        credits,

        amount,

        platformFee,

        netAmount,

        paypalEmail: doctor.email,

        status: processed
          ? "PROCESSED"
          : "PROCESSING",

        processedAt: processed
          ? new Date()
          : null,

        processedBy: processed
          ? "System Admin"
          : null,
      },
    });

    payouts.push(payout);

    STATS.payouts++;
  }

  success(`${payouts.length} payouts created`);

  return payouts;
}

/* ============================================================
   Payout Verification
============================================================ */

async function verifyPayouts() {
  section("Doctor Payout Verification");

  const total = await prisma.payout.count();

  const processed = await prisma.payout.count({
    where: {
      status: "PROCESSED",
    },
  });

  const processing = await prisma.payout.count({
    where: {
      status: "PROCESSING",
    },
  });

  const totals = await prisma.payout.aggregate({
    _sum: {
      amount: true,
      credits: true,
      platformFee: true,
      netAmount: true,
    },
  });

  console.log("");

  console.log(`Total Payouts : ${total}`);

  console.log(`Processed     : ${processed}`);

  console.log(`Processing    : ${processing}`);

  console.log("");

  console.log(
    `Credits Paid  : ${totals._sum.credits ?? 0}`
  );

  console.log(
    `Gross Amount  : $${totals._sum.amount ?? 0}`
  );

  console.log(
    `Platform Fee  : $${totals._sum.platformFee ?? 0}`
  );

  console.log(
    `Net Amount    : $${totals._sum.netAmount ?? 0}`
  );

  console.log("");
}
/* ============================================================
   Database Statistics
============================================================ */

async function printDatabaseStatistics() {
  section("Database Statistics");

  const [
    users,
    doctors,
    patients,
    schedules,
    breaks,
    leaves,
    appointments,
    transactions,
    payouts,
  ] = await Promise.all([
    prisma.user.count(),

    prisma.user.count({
      where: {
        role: "DOCTOR",
      },
    }),

    prisma.user.count({
      where: {
        role: "PATIENT",
      },
    }),

    prisma.doctorSchedule.count(),

    prisma.doctorBreak.count(),

    prisma.doctorLeave.count(),

    prisma.appointment.count(),

    prisma.creditTransaction.count(),

    prisma.payout.count(),
  ]);

  console.log("");

  console.log("Users");
  console.log("--------------------------------");
  console.log(`Total Users     : ${users}`);
  console.log(`Doctors         : ${doctors}`);
  console.log(`Patients        : ${patients}`);

  console.log("");

  console.log("Scheduling");
  console.log("--------------------------------");
  console.log(`Schedules       : ${schedules}`);
  console.log(`Breaks          : ${breaks}`);
  console.log(`Leaves          : ${leaves}`);

  console.log("");

  console.log("Appointments");
  console.log("--------------------------------");
  console.log(`Appointments    : ${appointments}`);

  console.log("");

  console.log("Finance");
  console.log("--------------------------------");
  console.log(`Transactions    : ${transactions}`);
  console.log(`Payouts         : ${payouts}`);

  console.log("");
}

/* ============================================================
   Appointment Status Report
============================================================ */

async function printAppointmentStatusReport() {
  section("Appointment Status Report");

  const completed =
    await prisma.appointment.count({
      where: {
        status: "COMPLETED",
      },
    });

  const scheduled =
    await prisma.appointment.count({
      where: {
        status: "SCHEDULED",
      },
    });

  const cancelled =
    await prisma.appointment.count({
      where: {
        status: "CANCELLED",
      },
    });

  console.log("");

  console.log(`Completed : ${completed}`);
  console.log(`Scheduled : ${scheduled}`);
  console.log(`Cancelled : ${cancelled}`);

  console.log("");
}

/* ============================================================
   Doctor Report
============================================================ */

async function printDoctorReport() {
  section("Doctor Report");

  const doctors = await prisma.user.findMany({
    where: {
      role: "DOCTOR",
    },

    orderBy: [
      {
        specialty: "asc",
      },
      {
        name: "asc",
      },
    ],

    include: {
      doctorAppointments: true,
    },
  });

  console.log("");

  doctors.forEach((doctor) => {
    const completed =
      doctor.doctorAppointments.filter(
        (appointment) =>
          appointment.status === "COMPLETED"
      ).length;

    const scheduled =
      doctor.doctorAppointments.filter(
        (appointment) =>
          appointment.status === "SCHEDULED"
      ).length;

    console.log(
      `${doctor.name}`
    );

    console.log(
      `   Specialty      : ${doctor.specialty}`
    );

    console.log(
      `   Experience     : ${doctor.experience} years`
    );

    console.log(
      `   Appointments   : ${doctor.doctorAppointments.length}`
    );

    console.log(
      `   Completed      : ${completed}`
    );

    console.log(
      `   Scheduled      : ${scheduled}`
    );

    console.log(
      `   Credits        : ${doctor.credits}`
    );

    console.log("");
  });
}

/* ============================================================
   Patient Report
============================================================ */

async function printPatientReport() {
  section("Patient Report");

  const patients = await prisma.user.findMany({
    where: {
      role: "PATIENT",
    },

    include: {
      patientAppointments: true,
    },

    orderBy: {
      name: "asc",
    },
  });

  console.log("");

  patients.forEach((patient) => {
    console.log(
      `${patient.name}`
    );

    console.log(
      `   Credits        : ${patient.credits}`
    );

    console.log(
      `   Appointments   : ${patient.patientAppointments.length}`
    );

    console.log("");
  });
}

/* ============================================================
   Seeder Statistics
============================================================ */

function printSeederStatistics() {
  section("Seeder Statistics");

  console.table(STATS);
}
/* ============================================================
   Main Seeder
============================================================ */

async function main() {
  console.clear();

  console.log("");
  console.log("🏥 Healthcare Platform Production Seeder");
  console.log("========================================");
  console.log("");

  const startedAt = Date.now();

  /* ----------------------------------------------------------
     Cleanup
  ---------------------------------------------------------- */

  await cleanClerkUsers();

  await cleanDatabase();

  await prisma.$disconnect();

  prisma = new PrismaClient();

  /* ----------------------------------------------------------
     Users
  ---------------------------------------------------------- */

  const users = await createUsers();

  /* ----------------------------------------------------------
     Schedules
  ---------------------------------------------------------- */

  const schedules =
    await createDoctorSchedules(
      users.doctors
    );




  /* ----------------------------------------------------------
     Appointments
  ---------------------------------------------------------- */

  const appointments =
    await createAppointments(
      users.doctors,
      users.patients
    );

  /* ----------------------------------------------------------
     Transactions
  ---------------------------------------------------------- */

  await createCreditTransactions(
    users.doctors,
    users.patients,
    appointments
  );

  /* ----------------------------------------------------------
     Payouts
  ---------------------------------------------------------- */

  await createPayouts(
    users.doctors,
    appointments
  );

  /* ----------------------------------------------------------
     Reports
  ---------------------------------------------------------- */

  await verifySchedules();

  await verifyDoctorAvailability();

  await verifyAppointments();

  await verifyTransactions();

  await verifyPayouts();

  await printDatabaseStatistics();

  await printAppointmentStatusReport();

  await printDoctorReport();

  await printPatientReport();

  printSeederStatistics();

  printUserSummary(users);

  /* ----------------------------------------------------------
     Finish
  ---------------------------------------------------------- */

  const totalSeconds =
    ((Date.now() - startedAt) / 1000).toFixed(2);

  console.log("");
  console.log("==========================================");
  console.log("🎉 Production Seed Completed Successfully");
  console.log("==========================================");
  console.log("");

  console.log(`Execution Time : ${totalSeconds}s`);

  console.log("");

  console.log("Admin");
  console.log("--------------------------------");

  console.log(
    `Email    : ${ADMIN.email}`
  );

  console.log(
    `Password : ${DEFAULT_PASSWORD}`
  );

  console.log("");

  console.log("Summary");
  console.log("--------------------------------");

  console.log(
    `Doctors      : ${users.doctors.length}`
  );

  console.log(
    `Patients     : ${users.patients.length}`
  );

  console.log(
    `Appointments : ${appointments.length}`
  );

  console.log(
    `Schedules    : ${STATS.schedules}`
  );

  console.log(
    `Breaks       : ${STATS.breaks}`
  );

  console.log(
    `Leaves       : ${STATS.leaves}`
  );

  console.log(
    `Transactions : ${STATS.transactions}`
  );

  console.log(
    `Payouts      : ${STATS.payouts}`
  );

  console.log("");

  console.log("==========================================");
}

/* ============================================================
   Execute Seeder
============================================================ */

main()
  .catch(async (error) => {
    console.error("");

    console.error(
      "❌ Seeder Failed"
    );

    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/* ============================================================
   Demo Credentials
============================================================ */

/*
--------------------------------------------------------------
ADMIN
--------------------------------------------------------------

Email:
admin+clerk_test@example.com

Password:
Asegsdvs@1234rqSDF

--------------------------------------------------------------
DOCTORS
--------------------------------------------------------------

doctor01+clerk_test@example.com
doctor02+clerk_test@example.com
...
doctor48+clerk_test@example.com

Password:
Asegsdvs@1234rqSDF

--------------------------------------------------------------
PATIENTS
--------------------------------------------------------------

patient01@gmail.com
patient02@gmail.com
...
patient20@gmail.com

Password:
Asegsdvs@1234rqSDF

--------------------------------------------------------------
Seed Summary
--------------------------------------------------------------

otp common for everyone : 424242