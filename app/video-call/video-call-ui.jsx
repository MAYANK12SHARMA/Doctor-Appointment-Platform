"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  User,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

export default function VideoCall({
  sessionId,
  token,
  role = "patient",
}) {
  const router = useRouter();
  const appId = process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID;

  const sessionRef = useRef(null);
  const publisherRef = useRef(null);
  const subscriberRef = useRef(null);
  const publisherContainerRef = useRef(null);
  const subscriberContainerRef = useRef(null);
  const initializedRef = useRef(false);

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [remoteJoined, setRemoteJoined] = useState(false);

  const isDoctor = role === "doctor";
  const remoteTitle = isDoctor ? "Patient" : "Doctor";

  function log(...args) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}][${role.toUpperCase()}]`, ...args);
  }

  function handleScriptLoad() {
    log("Vonage SDK Loaded");
    if (!window.OT) {
      toast.error("Failed to load Vonage SDK");
      setIsLoading(false);
      return;
    }
    setScriptLoaded(true);
  }

  function initializeSession() {
    log("🚀 Initializing session...");
    log("Session ID:", sessionId);
    log("App ID:", appId);
    log("Role:", role);

    if (!sessionId || !token || !appId) {
      log("❌ Invalid credentials");
      toast.error("Invalid video session.");
      router.push("/appointments");
      return;
    }

    try {
      const session = window.OT.initSession(appId, sessionId);
      sessionRef.current = session;

      log("✅ Session object created");

      session.on("sessionConnected", () => {
        log("✅ SESSION CONNECTED");
        setIsConnected(true);
      });

      session.on("connectionCreated", (event) => {
        log("🔗 Connection Created:", event.connection.connectionId);
        log("   - Is this me?", event.connection.connectionId === session.connection?.connectionId);
      });

      session.on("connectionDestroyed", (event) => {
        log("❌ Connection Destroyed:", event.connection.connectionId);
        if (event.connection.connectionId !== session.connection?.connectionId) {
          log("⚠️ Remote user left - hiding their video");
          setRemoteJoined(false);
        }
      });

      session.on("sessionDisconnected", () => {
        log("🔌 Session Disconnected");
        setIsConnected(false);
        setRemoteJoined(false);
      });

      session.on("streamCreated", (event) => {
        log("🎥 STREAM CREATED");
        log("   - Stream ID:", event.stream.streamId);
        log("   - Connection ID:", event.stream.connection.connectionId);
        log("   - Is this my stream?", event.stream.connection.connectionId === session.connection?.connectionId);

        if (event.stream.connection.connectionId === session.connection?.connectionId) {
          log("⏭️ Ignoring local stream (this is my own camera)");
          return;
        }

        log("👀 This is the REMOTE user's stream - attempting to subscribe...");

        if (!subscriberContainerRef.current) {
          log("⚠️ Subscriber container NOT ready, retrying in 500ms...");
          setTimeout(() => {
            if (subscriberContainerRef.current && document.contains(subscriberContainerRef.current)) {
              subscribeToStream(session, event.stream);
            }
          }, 500);
          return;
        }

        if (!document.contains(subscriberContainerRef.current)) {
          log("⚠️ Container not in DOM yet, waiting...");
          setTimeout(() => {
            if (document.contains(subscriberContainerRef.current)) {
              subscribeToStream(session, event.stream);
            }
          }, 300);
          return;
        }

        subscribeToStream(session, event.stream);
      });

      session.on("streamDestroyed", (event) => {
        log("🗑️ STREAM DESTROYED");
        log("   - Stream ID:", event.stream.streamId);
        if (event.stream.connection.connectionId !== session.connection?.connectionId) {
          log("⚠️ Remote stream destroyed - hiding video");
          setRemoteJoined(false);
        }
      });

      log("🔌 Connecting to session...");
      session.connect(token, (error) => {
        if (error) {
          log("❌ Session connect FAILED:", error);
          toast.error(error.message);
          setIsLoading(false);
          return;
        }

        log("✅ Session CONNECTED successfully");
        log("📹 Initializing publisher...");

        if (!publisherContainerRef.current) {
          log("❌ Publisher container NOT ready");
          setIsLoading(false);
          return;
        }

        const publisher = window.OT.initPublisher(
          publisherContainerRef.current,
          {
            insertMode: "append",
            width: "100%",
            height: "100%",
            fitMode: "cover",
            publishAudio: true,
            publishVideo: true,
            mirror: true,
            style: {
              buttonDisplayMode: "off",
              nameDisplayMode: "off",
              audioLevelDisplayMode: "off",
              archiveStatusDisplayMode: "off",
            },
          },
          (publisherError) => {
            if (publisherError) {
              log("❌ Publisher init FAILED:", publisherError);
              toast.error(publisherError.message);
              setIsLoading(false);
              return;
            }

            log("✅ Publisher INITIALIZED successfully");
            publisherRef.current = publisher;

            publisher.on("streamCreated", () => {
              log("📤 My stream is being PUBLISHED to the session");
            });

            publisher.on("streamDestroyed", () => {
              log("📤 My stream was DESTROYED");
            });

            publisher.on("exception", (exc) => {
              log("⚠️ Publisher EXCEPTION:", exc);
            });

            log("📤 Publishing to session...");
            session.publish(publisher, (publishError) => {
              if (publishError) {
                log("❌ Publish FAILED:", publishError);
                toast.error(publishError.message);
                setIsLoading(false);
                return;
              }
              log("✅ Camera PUBLISHED successfully - others should see you now!");
              setIsLoading(false);
            });
          }
        );
      });
    } catch (error) {
      log("❌ Initialization error:", error);
      toast.error("Unable to initialize video call.");
      setIsLoading(false);
    }
  }

  function subscribeToStream(session, stream) {
    log("📥 Subscribing to remote stream...");
    log("📦 Container:", subscriberContainerRef.current);

    // Destroy existing subscriber if any
    if (subscriberRef.current) {
      log("🗑️ Destroying existing subscriber");
      subscriberRef.current.destroy();
      subscriberRef.current = null;
    }

    session.subscribe(stream, subscriberContainerRef.current, {
      insertMode: "replace",
      width: "100%",
      height: "100%",
      fitMode: "cover",
      style: {
        buttonDisplayMode: "off",
        nameDisplayMode: "off",
        audioLevelDisplayMode: "off",
        archiveStatusDisplayMode: "off",
      },
    }, (err, subscriber) => {
      if (err || !subscriber) {
        log("❌ Subscribe FAILED:", err);
        return;
      }

      log("✅ SUBSCRIBER CREATED - remote video should appear NOW!");
      log("   - Subscriber ID:", subscriber.id);
      log("   - Subscriber stream ID:", subscriber.stream.streamId);
      log("   - Subscriber element:", subscriber.element);

      subscriberRef.current = subscriber;
      setRemoteJoined(true);

      subscriber.on("connected", () => {
        log("✅ SUBSCRIBER CONNECTED - you can NOW see the remote user!");
        log("🎉 Remote video is ACTIVE and VISIBLE");
      });

      subscriber.on("disconnected", () => {
        log("⚠️ Subscriber DISCONNECTED");
        setRemoteJoined(false);
      });

      subscriber.on("streamVideoEnabled", () => {
        log("📹 Remote user ENABLED their video");
      });

      subscriber.on("streamVideoDisabled", () => {
        log("📹 Remote user DISABLED their video");
      });

      subscriber.on("streamAudioEnabled", () => {
        log("🎤 Remote user ENABLED their audio");
      });

      subscriber.on("streamAudioDisabled", () => {
        log("🎤 Remote user DISABLED their audio");
      });

      subscriber.on("exception", (exc) => {
        log("⚠️ Subscriber EXCEPTION:", exc);
      });
    });
  }

  useEffect(() => {
    if (!scriptLoaded || initializedRef.current) return;
    initializedRef.current = true;
    initializeSession();
    return () => {
      initializedRef.current = false;
    };
  }, [scriptLoaded]);

  function toggleVideo() {
    if (!publisherRef.current) {
      log("⚠️ Cannot toggle video - publisher not ready");
      return;
    }
    const nextState = !isVideoEnabled;
    publisherRef.current.publishVideo(nextState);
    setIsVideoEnabled(nextState);
    log(nextState ? "📹 Video ENABLED" : "📹 Video DISABLED");
  }

  function toggleAudio() {
    if (!publisherRef.current) {
      log("⚠️ Cannot toggle audio - publisher not ready");
      return;
    }
    const nextState = !isAudioEnabled;
    publisherRef.current.publishAudio(nextState);
    setIsAudioEnabled(nextState);
    log(nextState ? "🎤 Audio ENABLED" : "🎤 Audio DISABLED");
  }

  function endCall() {
    log("📞 Ending call...");
    try {
      if (subscriberRef.current) {
        subscriberRef.current.destroy();
        subscriberRef.current = null;
        log("🧹 Subscriber destroyed");
      }
      if (publisherRef.current) {
        publisherRef.current.destroy();
        publisherRef.current = null;
        log("🧹 Publisher destroyed");
      }
      if (sessionRef.current) {
        sessionRef.current.disconnect();
        sessionRef.current = null;
        log("🔌 Session disconnected");
      }
    } catch (error) {
      log("❌ End call error:", error);
    }
    toast.success("Call ended");
    router.push("/appointments");
  }

  useEffect(() => {
    return () => {
      log("🧹 Component unmounting - cleaning up...");
      try {
        if (subscriberRef.current) {
          subscriberRef.current.destroy();
          subscriberRef.current = null;
        }
        if (publisherRef.current) {
          publisherRef.current.destroy();
          publisherRef.current = null;
        }
        if (sessionRef.current) {
          sessionRef.current.disconnect();
          sessionRef.current = null;
        }
      } catch (error) {
        log("❌ Cleanup error:", error);
      }
    };
  }, []);

  if (!sessionId || !token || !appId) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center">
        <User className="mb-6 h-20 w-20 text-gray-400" />
        <h1 className="text-3xl font-bold">Invalid Video Call</h1>
        <p className="mt-3 text-muted-foreground">Missing video session credentials.</p>
        <Button className="mt-8" onClick={() => router.push("/appointments")}>
          Back to Appointments
        </Button>
      </div>
    );
  }

  const ConnectionBadge = () => (
    <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
      isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    }`}>
      {isConnected ? (
        <><Wifi className="h-4 w-4" /> Connected</>
      ) : (
        <><WifiOff className="h-4 w-4" /> Disconnected</>
      )}
    </div>
  );
    return (
    <>
      <Script
        src="https://static.opentok.com/v2/js/opentok.min.js"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={() => {
          toast.error("Failed to load Vonage SDK.");
          setIsLoading(false);
        }}
      />

      <div className="relative h-screen w-full overflow-hidden bg-black">
        {isLoading && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center bg-black">
            <div className="flex flex-col items-center">
              <Loader2 className="h-16 w-16 animate-spin text-emerald-500" />
              <h2 className="mt-6 text-2xl font-semibold text-white">Connecting...</h2>
              <p className="mt-2 text-gray-400">Please wait while we join the consultation.</p>
            </div>
          </div>
        )}

        {/* Subscriber container - NO conditional rendering inside! */}
        <div
          ref={subscriberContainerRef}
          id="subscriber"
          className="absolute inset-0 bg-black"
        />

        {/* Overlay for "waiting" message - separate from subscriber container */}
        {!remoteJoined && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/10 backdrop-blur">
              <User className="h-16 w-16 text-white" />
            </div>
            <h2 className="mt-8 text-3xl font-semibold text-white">
              Waiting for {remoteTitle}
            </h2>
            <p className="mt-3 text-gray-400">
              They will appear here once they join the consultation.
            </p>
          </div>
        )}

        <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Video Consultation</h1>
            <p className="mt-1 text-sm text-gray-300">{remoteTitle}</p>
          </div>
          <ConnectionBadge />
        </div>

        <div className="absolute right-8 top-24 z-40 overflow-hidden rounded-2xl border border-white/20 bg-black shadow-2xl backdrop-blur">
          <div className="bg-black/80 px-3 py-2">
            <p className="text-sm font-medium text-white">You</p>
          </div>
          <div
            ref={publisherContainerRef}
            id="publisher"
            className="h-[220px] w-[320px] bg-black"
          />
        </div>

        {remoteJoined && (
          <div className="absolute bottom-36 left-8 z-30 rounded-full bg-black/50 px-5 py-2 backdrop-blur-md">
            <p className="text-white font-medium">{remoteTitle}</p>
          </div>
        )}

        <div className="absolute bottom-8 left-1/2 z-50 -translate-x-1/2 flex items-center gap-5 rounded-full border border-white/10 bg-black/65 px-6 py-4 shadow-2xl backdrop-blur-xl">
          <Button
            size="icon"
            onClick={toggleVideo}
            variant="ghost"
            className={`h-16 w-16 rounded-full transition-all duration-300 hover:scale-110 ${
              isVideoEnabled
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {isVideoEnabled ? <Video className="h-7 w-7" /> : <VideoOff className="h-7 w-7" />}
          </Button>

          <Button
            size="icon"
            onClick={toggleAudio}
            variant="ghost"
            className={`h-16 w-16 rounded-full transition-all duration-300 hover:scale-110 ${
              isAudioEnabled
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {isAudioEnabled ? <Mic className="h-7 w-7" /> : <MicOff className="h-7 w-7" />}
          </Button>

          <Button
            size="icon"
            onClick={endCall}
            className="h-20 w-20 rounded-full bg-red-600 text-white shadow-xl transition-all duration-300 hover:scale-110 hover:bg-red-700"
          >
            <PhoneOff className="h-9 w-9" />
          </Button>
        </div>

        <div className="absolute left-8 bottom-8 z-40 rounded-xl bg-black/50 px-5 py-4 text-white backdrop-blur-lg">
          <p className="text-lg font-semibold">{remoteTitle}</p>
          <div className="mt-2 flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${remoteJoined ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}
            />
            <span className="text-sm text-gray-300">
              {remoteJoined ? "In Call" : "Waiting to Join"}
            </span>
          </div>
        </div>

        <div className="absolute right-10 top-[340px] z-40 rounded-full bg-black/60 px-4 py-2 backdrop-blur-md">
          <span className="text-sm text-white font-medium">You</span>
        </div>

        <style jsx>{`
          @media (max-width: 768px) {
            #publisher {
              width: 140px !important;
              height: 200px !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}


  