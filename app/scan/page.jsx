"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";

const buttonClassName =
  "rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50";

export default function ScanPage() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventError, setEventError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const scannerRef = useRef(null);
  const processingRef = useRef(false);
  const mountedRef = useRef(false);
  const cooldownTimeoutRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      try {
        const response = await fetch("/api/events");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load events");
        }

        if (!Array.isArray(data)) {
          throw new Error("Unexpected events response");
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Unauthorized");
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        const visibleEvents =
          profile.role === "admin"
            ? data
            : data.filter((event) => event.created_by === user.id);

        if (!cancelled) {
          setEvents(visibleEvents);
          setSelectedEventId(
            visibleEvents.length > 0 ? String(visibleEvents[0].id) : "",
          );
          setEventError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setEventError(loadError.message || "Could not load events");
        }
      } finally {
        if (!cancelled) {
          setLoadingEvents(false);
        }
      }
    }

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (cooldownTimeoutRef.current) {
        window.clearTimeout(cooldownTimeoutRef.current);
      }
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .catch((error) => {
            console.error("Could not stop QR scanner during cleanup", error);
          })
          .finally(() => {
            try {
              scanner.clear();
            } catch (error) {
              console.error("Could not clear QR scanner during cleanup", error);
            }
          });
      }
    };
  }, []);

  async function handleDecodedQr(decodedText) {
    if (processingRef.current) {
      return;
    }

    let token;
    try {
      const decoded = JSON.parse(decodedText);
      token = decoded?.token;
    } catch {
      return;
    }

    if (typeof token !== "string" || !token || !selectedEventId) {
      return;
    }

    processingRef.current = true;
    setProcessing(true);

    try {
      const response = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: token, eventId: selectedEventId }),
      });
      const data = await response.json();

      if (mountedRef.current) {
        setResult({
          status: data.status || "error",
          message:
            data.message || data.error || "Could not check in this QR code",
        });
      }
    } catch (error) {
      if (mountedRef.current) {
        setResult({
          status: "error",
          message: error.message || "Could not check in this QR code",
        });
      }
    } finally {
      cooldownTimeoutRef.current = window.setTimeout(() => {
        processingRef.current = false;
        if (mountedRef.current) {
          setProcessing(false);
        }
      }, 2000);
    }
  }

  async function startScanning() {
    if (!selectedEventId || scannerRef.current) {
      return;
    }

    setResult(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!mountedRef.current) {
        return;
      }

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          void handleDecodedQr(decodedText);
        },
        () => {},
      );

      if (!mountedRef.current) {
        await scanner.stop();
        scanner.clear();
        scannerRef.current = null;
        return;
      }

      setScanning(true);
    } catch (error) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        try {
          if (scanner.isScanning) {
            await scanner.stop();
          }
          scanner.clear();
        } catch (clearError) {
          console.error(
            "Could not clear QR scanner after startup failure",
            clearError,
          );
        }
      }
      if (mountedRef.current) {
        setScanning(false);
        setResult({
          status: "error",
          message: error.message || "Could not start the camera",
        });
      }
    }
  }

  async function stopScanning() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);

    if (!scanner) {
      return;
    }

    try {
      await scanner.stop();
      scanner.clear();
    } catch (error) {
      setResult({
        status: "error",
        message: error.message || "Could not stop the camera",
      });
      try {
        scanner.clear();
      } catch (clearError) {
        console.error("Could not clear QR scanner after stopping", clearError);
      }
    }
  }

  const resultColor =
    result?.status === "checked_in"
      ? "border-green-200 bg-green-50 text-green-800"
      : result?.status === "already_checked_in"
        ? "border-yellow-200 bg-yellow-50 text-yellow-800"
        : "border-red-200 bg-red-50 text-red-800";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Nav />
      <main className="w-full flex-1 px-6 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">
              Connect EMEA
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">
              Scan attendance
            </h1>
            <p className="mt-3 text-base leading-7 text-gray-600">
              Choose an event, then scan a student&apos;s Connect QR code.
            </p>
          </div>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <label
              htmlFor="event"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Event
            </label>
            <select
              id="event"
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              disabled={loadingEvents || scanning || events.length === 0}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50"
            >
              {events.length === 0 && (
                <option value="">
                  {loadingEvents ? "Loading events..." : "No events available"}
                </option>
              )}
              {events.map((event) => (
                <option key={event.id} value={String(event.id)}>
                  {event.name} — {event.event_date}
                </option>
              ))}
            </select>

            {eventError && (
              <p
                role="alert"
                className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
              >
                {eventError}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {!scanning ? (
                <button
                  type="button"
                  onClick={startScanning}
                  disabled={loadingEvents || !selectedEventId}
                  className={buttonClassName}
                >
                  Start scanning
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopScanning}
                  className={buttonClassName}
                >
                  Stop scanning
                </button>
              )}
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Back to dashboard
              </Link>
            </div>

            <div
              id="qr-reader"
              className="mt-6 w-full max-h-[60vh] overflow-hidden rounded-xl [&_video]:max-h-[60vh] [&_video]:w-full [&_video]:object-cover"
            />

            {processing && (
              <p className="mt-4 text-sm text-gray-500">Processing scan...</p>
            )}

            {result && (
              <p
                role="status"
                className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${resultColor}`}
              >
                {result.message}
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
