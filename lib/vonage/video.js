import fs from "fs";
import path from "path";

import { Auth } from "@vonage/auth";
import { Vonage } from "@vonage/server-sdk";

/* -------------------------------------------------------------------------- */
/*                           Singleton Vonage Client                          */
/* -------------------------------------------------------------------------- */

let vonageClient = null;

/**
 * Returns a singleton Vonage client.
 */
function getVonageClient() {
  if (vonageClient) {
    return vonageClient;
  }

  const applicationId = process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID;

  if (!applicationId) {
    throw new Error("Missing NEXT_PUBLIC_VONAGE_APPLICATION_ID in .env.local");
  }

  const privateKeyPath =
    process.env.NEXT_PRIVATE_VONAGE_PRIVATE_KEY ||
    path.join(process.cwd(), "private.key");

  const resolvedPath = path.resolve(privateKeyPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Vonage private key not found:\n${resolvedPath}`);
  }

  const privateKey = fs.readFileSync(resolvedPath, "utf8");

  const auth = new Auth({
    applicationId,
    privateKey,
  });

  vonageClient = new Vonage(auth);

  console.log("✅ Vonage client initialized");

  return vonageClient;
}

/* -------------------------------------------------------------------------- */
/*                           Create Video Session                             */
/* -------------------------------------------------------------------------- */

export async function createVideoSession() {
  try {
    const vonage = getVonageClient();

    const session = await vonage.video.createSession({
      mediaMode: "routed",
    });

    console.log("✅ Session Created:", session.sessionId);

    return session.sessionId;
  } catch (error) {
    console.error("❌ Failed to create video session");
    console.error(error);

    throw new Error(error.message || "Unable to create Vonage session.");
  }
}

/* -------------------------------------------------------------------------- */
/*                           Generate Video Token                             */
/* -------------------------------------------------------------------------- */

// console.log("==================================");
// console.log("Appointment:", appointmentId);
// console.log("Session:", appointment.videoSessionId);
// console.log("User:", user.role);
// console.log("==================================");

export function generateVideoToken(sessionId, role = "publisher") {
  try {
    const vonage = getVonageClient();

    const token = vonage.video.generateClientToken(sessionId, {
      role,
      expireTime: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    });

    console.log("✅ Token Generated");

    return token;
  } catch (error) {
    console.error("❌ Failed to generate token");
    console.error(error);

    throw new Error(error.message || "Unable to generate Vonage token.");
  }
}
