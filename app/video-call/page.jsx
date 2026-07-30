import { redirect } from "next/navigation";
import VideoCall from "./video-call-ui";

export default async function VideoCallPage({ searchParams }) {
  const { sessionId, token, role } = await searchParams;

  if (!sessionId || !token) {
    redirect("/appointments");
  }

  return (
    <VideoCall
      sessionId={sessionId}
      token={token}
      role={role || "patient"}
    />
  );
}