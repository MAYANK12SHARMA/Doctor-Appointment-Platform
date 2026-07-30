// require("dotenv").config({ path: ".env.local" });

// const fs = require("fs");
// const { Auth } = require("@vonage/auth");
// const { Vonage } = require("@vonage/server-sdk");

// async function main() {
//   try {
//     const applicationId = process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID;

//     const privateKey = fs.readFileSync(
//       process.env.NEXT_PRIVATE_VONAGE_PRIVATE_KEY,
//       "utf8",
//     );

//     const auth = new Auth({
//       applicationId,
//       privateKey,
//     });

//     const vonage = new Vonage(auth);

//     console.log("Creating session...");

//     const session = await vonage.video.createSession({
//       mediaMode: "routed",
//     });

//     console.log("✅ SUCCESS");
//     console.log(session);
//   } catch (err) {
//     console.log("❌ ERROR");
//     console.log("Name:", err.name);
//     console.log("Message:", err.message);

//     if (err.response) {
//       console.log("Status:", err.response.status);
//       console.log("Body:", err.response.data);
//     }

//     console.dir(err, { depth: null });
//   }
// }

// main();


function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const inputs = [
  "2026-07-29",
  "2026-07-30",
  "2026-08-01",
];

for (const input of inputs) {
  console.log("================================");
  console.log("Input:", input);

  const date = new Date(input);

  console.log("new Date():");
  console.log("toString()      :", date.toString());
  console.log("toISOString()   :", date.toISOString());
  console.log("toLocaleString():", date.toLocaleString());
  console.log("getDate()       :", date.getDate());

  const normalized = normalizeDate(input);

  console.log("\nAfter normalizeDate()");
  console.log("toString()      :", normalized.toString());
  console.log("toISOString()   :", normalized.toISOString());
  console.log("getDate()       :", normalized.getDate());
}