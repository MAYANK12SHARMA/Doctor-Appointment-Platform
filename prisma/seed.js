/* ============================================================
   Prisma + Clerk Seed
   ============================================================ */

import { PrismaClient } from "@prisma/client";
import { createClerkClient } from "@clerk/backend";

let prisma = new PrismaClient();

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/* ============================================================
   Configuration
   ============================================================ */

const DEFAULT_PASSWORD = "Asegsdvs@1234rqSDF";

const DOCTOR_TIMEZONE = "Asia/Kolkata";

const CONSULTATION_DURATION = 30;

/* ============================================================
   Demo Users
   ============================================================ */

const USERS = {
  admin: {
    email: "admin@healthcare.com",
    password: DEFAULT_PASSWORD,
    firstName: "System",
    lastName: "Admin",
    role: "ADMIN",
  },

  doctors: [
    {
      email: "amit.sharma@healthcare.com",
      password: DEFAULT_PASSWORD,
      firstName: "Amit",
      lastName: "Sharma",
      specialty: "Cardiologist",
      experience: 12,
    },

    {
      email: "priya.verma@healthcare.com",
      password: DEFAULT_PASSWORD,
      firstName: "Priya",
      lastName: "Verma",
      specialty: "Dermatologist",
      experience: 8,
    },

    {
      email: "rahul.mehta@healthcare.com",
      password: DEFAULT_PASSWORD,
      firstName: "Rahul",
      lastName: "Mehta",
      specialty: "Neurologist",
      experience: 15,
    },
  ],

  patients: [
    {
      email: "patient1@gmail.com",
      password: DEFAULT_PASSWORD,
      firstName: "Mayank",
      lastName: "Sharma",
    },

    {
      email: "patient2@gmail.com",
      password: DEFAULT_PASSWORD,
      firstName: "Rohit",
      lastName: "Singh",
    },

    {
      email: "patient3@gmail.com",
      password: DEFAULT_PASSWORD,
      firstName: "Anjali",
      lastName: "Gupta",
    },

    {
      email: "patient4@gmail.com",
      password: DEFAULT_PASSWORD,
      firstName: "Sneha",
      lastName: "Agarwal",
    },
  ],
};

/* ============================================================
   Clerk Helper Functions
   ============================================================ */

/**
 * Find user by email.
 */
async function findClerkUserByEmail(email) {
  const response = await clerk.users.getUserList({
    emailAddress: [email],
  });

  return response.data[0] ?? null;
}

/**
 * Delete Clerk user if already exists.
 */
async function deleteClerkUserIfExists(email) {
  const existing = await findClerkUserByEmail(email);

  if (!existing) return;

  console.log(`🗑 Clerk: ${email}`);

  await clerk.users.deleteUser(existing.id);
}

/**
 * Create Clerk user.
 */
async function createClerkUser({ email, password, firstName, lastName }) {
  console.log(`👤 Clerk: ${email}`);

  return clerk.users.createUser({
    emailAddress: [email],
    password,
    firstName,
    lastName,
    skipPasswordChecks: true,
  });
}

/**
 * Create matching Prisma user.
 */
async function createPrismaUser(clerkUser, data) {
  const prismaData = {
    clerkUserId: clerkUser.id,
    email: clerkUser.emailAddresses[0].emailAddress,
    name: `${data.firstName} ${data.lastName}`,
    role: data.role,
    imageUrl: clerkUser.imageUrl,
    specialty: data.specialty ?? null,
    experience: data.experience ?? null,
    description:
      data.role === "DOCTOR"
        ? `Dr. ${data.firstName} ${data.lastName} is an experienced ${data.specialty}.`
        : null,
    verificationStatus: data.role === "DOCTOR" ? "VERIFIED" : null,
    consultationDuration: CONSULTATION_DURATION,
    timezone: DOCTOR_TIMEZONE,
    credits: data.role === "PATIENT" ? 20 : 0,
  };

  console.log("=== Prisma Data ===");
  console.dir(prismaData, { depth: null });

  return prisma.user.create({
    data: prismaData,
  });
}
/* ============================================================
   Database Cleanup
   ============================================================ */

async function cleanClerkUsers() {
  console.log("\n🧹 Cleaning Clerk Users...\n");

  await deleteClerkUserIfExists(USERS.admin.email);

  for (const doctor of USERS.doctors) {
    await deleteClerkUserIfExists(doctor.email);
  }

  for (const patient of USERS.patients) {
    await deleteClerkUserIfExists(patient.email);
  }

  console.log("✅ Clerk cleanup completed.\n");
}

async function cleanDatabase() {
  console.log("Cleaning payouts...");
  await prisma.payout.deleteMany();

  console.log("Cleaning transactions...");
  await prisma.creditTransaction.deleteMany();

  console.log("Cleaning appointments...");
  await prisma.appointment.deleteMany();

  console.log("Cleaning leaves...");
  await prisma.doctorLeave.deleteMany();

  console.log("Cleaning breaks...");
  await prisma.doctorBreak.deleteMany();

  console.log("Cleaning schedules...");
  await prisma.doctorSchedule.deleteMany();

  console.log("Cleaning users...");
  await prisma.user.deleteMany();

  console.log("Done.");
}
c;

/* ============================================================
   Date Helpers
   ============================================================ */

function today() {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date;
}

function addDays(days) {
  const date = today();

  date.setDate(date.getDate() + days);

  return date;
}

function combineDateAndTime(date, time) {
  const [hour, minute] = time.split(":").map(Number);

  const value = new Date(date);

  value.setHours(hour);
  value.setMinutes(minute);
  value.setSeconds(0);
  value.setMilliseconds(0);

  return value;
}

function addMinutes(date, minutes) {
  const value = new Date(date);

  value.setMinutes(value.getMinutes() + minutes);

  return value;
}

/* ============================================================
   Random Helpers
   ============================================================ */

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ============================================================
   Logging Helpers
   ============================================================ */

function section(title) {
  console.log("\n");
  console.log("=".repeat(60));
  console.log(title);
  console.log("=".repeat(60));
}

function success(message) {
  console.log(`✅ ${message}`);
}

function info(message) {
  console.log(`ℹ️  ${message}`);
}

/* ============================================================
   Create Users
   ============================================================ */

async function createUsers() {
  section("Creating Users");

  /* ----------------------------------------------------------
     Admin
  ---------------------------------------------------------- */

  info("Creating Admin...");

  const adminClerk = await createClerkUser(USERS.admin);

  console.log("========== CLERK USER ==========");
  console.dir(adminClerk, { depth: null });
  console.log("================================");

  const admin = await createPrismaUser(adminClerk, {
    ...USERS.admin,
    role: "ADMIN",
  });

  success(`Admin Created (${admin.email})`);

  await sleep(300);

  /* ----------------------------------------------------------
     Doctors
  ---------------------------------------------------------- */

  info("Creating Doctors...");

  const doctors = [];

  for (const doctor of USERS.doctors) {
    const clerkUser = await createClerkUser(doctor);

    const prismaDoctor = await createPrismaUser(clerkUser, {
      ...doctor,
      role: "DOCTOR",
    });

    doctors.push(prismaDoctor);

    success(`Doctor Created (${prismaDoctor.email})`);

    await sleep(300);
  }

  /* ----------------------------------------------------------
     Patients
  ---------------------------------------------------------- */

  info("Creating Patients...");

  const patients = [];

  for (const patient of USERS.patients) {
    const clerkUser = await createClerkUser(patient);

    const prismaPatient = await createPrismaUser(clerkUser, {
      ...patient,
      role: "PATIENT",
    });

    patients.push(prismaPatient);

    success(`Patient Created (${prismaPatient.email})`);

    await sleep(300);
  }

  console.log("");

  success(`Created ${1 + doctors.length + patients.length} Clerk Users`);

  return {
    admin,
    doctors,
    patients,
  };
}

/* ============================================================
   Summary Helper
   ============================================================ */

function printUserSummary({ admin, doctors, patients }) {
  section("Seed Summary");

  console.log("");

  console.log("Admin");
  console.log("----------------------------");
  console.log(admin.email);

  console.log("");

  console.log("Doctors");
  console.log("----------------------------");

  doctors.forEach((doctor) => {
    console.log(`${doctor.name} (${doctor.specialty})`);
  });

  console.log("");

  console.log("Patients");
  console.log("----------------------------");

  patients.forEach((patient) => {
    console.log(patient.name);
  });

  console.log("");
}

/* ============================================================
   Monthly Schedules
============================================================ */

async function createMonthlySchedules(doctors) {
  section("Creating Monthly Schedules");

  const schedules = [];

  const WEEKDAYS = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  for (const doctor of doctors) {
    info(`Schedule -> ${doctor.name}`);

    for (let i = 0; i < 14; i++) {
      const scheduleDate = addDays(i);

      const weekday = WEEKDAYS[scheduleDate.getDay()];

      const isSunday = weekday === "SUNDAY";

      const schedule = await prisma.doctorSchedule.create({
        data: {
          doctor: {
            connect: {
              id: doctor.id,
            },
          },

          scheduleDate,

          weekday,

          startTime: isSunday ? "" : "09:00",

          endTime: isSunday ? "" : "17:00",

          slotDuration: doctor.consultationDuration,

          timezone: doctor.timezone,

          isAvailable: !isSunday,
        },
      });

      schedules.push(schedule);
    }
  }

  success(`${schedules.length} schedules created`);

  return schedules;
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

    const day = schedule.scheduleDate.getDay();

    const lunch = await prisma.doctorBreak.create({
      data: {
        scheduleId: schedule.id,

        title: "Lunch Break",

        startTime: "13:00",

        endTime: "13:30",
      },
    });

    breaks.push(lunch);

    // Monday-Saturday Tea Break
    if (day !== 6) {
      const tea = await prisma.doctorBreak.create({
        data: {
          scheduleId: schedule.id,

          title: "Tea Break",

          startTime: "15:30",

          endTime: "15:45",
        },
      });

      breaks.push(tea);
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

  const reasons = [
    "Medical Conference",
    "Personal Leave",
    "Family Function",
    "Annual Leave",
    "Health Checkup",
  ];

  for (const doctor of doctors) {
    for (let i = 0; i < 2; i++) {
      const leave = await prisma.doctorLeave.create({
        data: {
          doctorId: doctor.id,

          // Leave within the next 14 scheduled days
          leaveDate: addDays(randomInt(3, 12)),

          reason: randomItem(reasons),
        },
      });

      leaves.push(leave);
    }
  }

  success(`${leaves.length} leave records created`);

  return leaves;
}

/* ============================================================
   Appointments
============================================================ */

async function createAppointments(doctors, patients) {
  section("Creating Appointments");

  const appointments = [];

  for (let i = 0; i < 12; i++) {
    const doctor = randomItem(doctors);

    const patient = randomItem(patients);

    /* ----------------------------------------------------------
       Pick one available schedule
    ---------------------------------------------------------- */

    const schedules = await prisma.doctorSchedule.findMany({
      where: {
        doctorId: doctor.id,
        isAvailable: true,
      },
      include: {
        breaks: true,
      },
    });

    if (!schedules.length) {
      continue;
    }

    const schedule = randomItem(schedules);

    const appointmentDate = schedule.scheduleDate;

    /* ----------------------------------------------------------
       Generate possible slots
    ---------------------------------------------------------- */

    const possibleTimes = [];

    let currentHour = 9;
    let currentMinute = 0;

    while (currentHour < 17) {
      const time = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

      const inLunch = time >= "13:00" && time < "13:30";

      const inTea = time >= "15:30" && time < "15:45";

      if (!inLunch && !inTea) {
        possibleTimes.push(time);
      }

      currentMinute += doctor.consultationDuration;

      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }

    if (!possibleTimes.length) {
      continue;
    }

    const startTimeString = randomItem(possibleTimes);

    const startTime = combineDateAndTime(appointmentDate, startTimeString);

    const endTime = addMinutes(startTime, doctor.consultationDuration);

    /* ----------------------------------------------------------
       Prevent duplicate booking
    ---------------------------------------------------------- */

    const existing = await prisma.appointment.findUnique({
      where: {
        doctorId_appointmentDate_startTime: {
          doctorId: doctor.id,
          appointmentDate,
          startTime,
        },
      },
    });

    if (existing) {
      continue;
    }

    /* ----------------------------------------------------------
       Create appointment
    ---------------------------------------------------------- */

    const appointment = await prisma.appointment.create({
      data: {
        doctorId: doctor.id,

        patientId: patient.id,

        appointmentDate,

        startTime,

        endTime,

        durationMinutes: doctor.consultationDuration,

        timezone: doctor.timezone,

        status: "SCHEDULED",

        patientDescription: "General health consultation.",

        videoSessionId: `session-${i + 1}`,

        videoSessionToken: `token-${i + 1}`,
      },
    });

    appointments.push(appointment);

    /* ----------------------------------------------------------
       Transfer credits
    ---------------------------------------------------------- */

    await prisma.user.update({
      where: {
        id: patient.id,
      },
      data: {
        credits: {
          decrement: 2,
        },
      },
    });

    await prisma.user.update({
      where: {
        id: doctor.id,
      },
      data: {
        credits: {
          increment: 2,
        },
      },
    });
  }

  success(`${appointments.length} appointments created`);

  return appointments;
}
/* ============================================================
   Credit Transactions
============================================================ */

async function createCreditTransactions(doctors, patients, appointments) {
  section("Creating Credit Transactions");

  const transactions = [];

  /* ----------------------------------------------------------
     Patient Transactions
  ---------------------------------------------------------- */

  for (const patient of patients) {
    // Initial credit purchase
    transactions.push({
      userId: patient.id,

      amount: 20,

      type: "CREDIT_PURCHASE",

      packageId: "STARTER_PACK",
    });

    // Credits deducted for booked appointments
    const patientAppointments = appointments.filter(
      (appointment) => appointment.patientId === patient.id,
    );

    for (const appointment of patientAppointments) {
      transactions.push({
        userId: patient.id,

        amount: -2,

        type: "APPOINTMENT_DEDUCTION",

        packageId: appointment.id,
      });
    }
  }

  /* ----------------------------------------------------------
     Doctor Credit Earnings
  ---------------------------------------------------------- */

  for (const doctor of doctors) {
    const doctorAppointments = appointments.filter(
      (appointment) => appointment.doctorId === doctor.id,
    );

    for (const appointment of doctorAppointments) {
      transactions.push({
        userId: doctor.id,

        amount: 2,

        type: "ADMIN_ADJUSTMENT",

        packageId: appointment.id,
      });
    }
  }

  await prisma.creditTransaction.createMany({
    data: transactions,
  });

  success(`${transactions.length} credit transactions created`);

  return transactions;
}

/* ============================================================
   Payouts
============================================================ */

async function createPayouts(doctors, appointments) {
  section("Creating Doctor Payouts");

  const payouts = [];

  for (const doctor of doctors) {
    const doctorAppointments = appointments.filter(
      (appointment) => appointment.doctorId === doctor.id,
    );

    if (!doctorAppointments.length) {
      continue;
    }

    const credits = doctorAppointments.length * 2;

    const amount = credits * 10;

    const platformFee = credits * 2;

    const netAmount = amount - platformFee;

    const payout = await prisma.payout.create({
      data: {
        doctorId: doctor.id,

        credits,

        amount,

        platformFee,

        netAmount,

        paypalEmail: doctor.email,

        status: Math.random() > 0.5 ? "PROCESSED" : "PROCESSING",

        processedAt: Math.random() > 0.5 ? new Date() : null,

        processedBy: Math.random() > 0.5 ? "System Admin" : null,
      },
    });

    payouts.push(payout);
  }

  success(`${payouts.length} payouts created`);

  return payouts;
}
/* ============================================================
   Main
============================================================ */

async function main() {
  console.clear();

  console.log("");
  console.log("🏥 Healthcare Platform Database Seeder");
  console.log("======================================");
  console.log("");

  /* ----------------------------------------------------------
     Clean Existing Data
  ---------------------------------------------------------- */

  await cleanClerkUsers();

  await cleanDatabase();

  await prisma.$disconnect();

  prisma = new PrismaClient();

  /* ----------------------------------------------------------
     Create Users
  ---------------------------------------------------------- */

  const { admin, doctors, patients } = await createUsers();

  /* ----------------------------------------------------------
     Create Monthly Schedules
  ---------------------------------------------------------- */

  const schedules = await createMonthlySchedules(doctors);

  /* ----------------------------------------------------------
     Create Breaks
  ---------------------------------------------------------- */

  await createDoctorBreaks(schedules);

  /* ----------------------------------------------------------
     Create Doctor Leaves
  ---------------------------------------------------------- */

  await createDoctorLeaves(doctors);

  /* ----------------------------------------------------------
     Create Demo Appointments
  ---------------------------------------------------------- */

  const appointments = await createAppointments(doctors, patients);

  /* ----------------------------------------------------------
     Credit History
  ---------------------------------------------------------- */

  await createCreditTransactions(doctors, patients, appointments);

  /* ----------------------------------------------------------
     Payouts
  ---------------------------------------------------------- */

  await createPayouts(doctors, appointments);

  /* ----------------------------------------------------------
     Summary
  ---------------------------------------------------------- */

  printUserSummary({
    admin,
    doctors,
    patients,
  });

  console.log("");
  console.log("======================================");
  console.log("🎉 Database Seed Completed Successfully");
  console.log("======================================");
  console.log("");
}
/* ============================================================
   Run Seeder
============================================================ */

main()
  .catch(async (error) => {
    console.error("");
    console.error("❌ Seed Failed");
    console.error(error);

    await prisma.$disconnect();

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/* ============================================================
   Demo Login Credentials
============================================================ */

// Admin
// ------------------------------------------------------------
// Email    : admin@healthcare.com
// Password : Asegsdvs@1234rqSDF

// Doctors
// ------------------------------------------------------------
// amit.sharma@healthcare.com   |   Asegsdvs@1234rqSDF
// priya.verma@healthcare.com   |   Asegsdvs@1234rqSDF
// rahul.mehta@healthcare.com   |   Asegsdvs@1234rqSDF

// Patients
// ------------------------------------------------------------
// patient1@gmail.com   |   Asegsdvs@1234rqSDF

// patient2@gmail.com   |   Asegsdvs@1234rqSDF
// patient3@gmail.com   |   Asegsdvs@1234rqSDF
// patient4@gmail.com   |   Asegsdvs@1234rqSDF
