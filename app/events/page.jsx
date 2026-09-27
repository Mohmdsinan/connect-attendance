"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/Modal";

const inputClassName =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-500";

async function readJsonResponse(response) {
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || "Request failed");
  }

  return body;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [requiresRegistration, setRequiresRegistration] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [registeringId, setRegisteringId] = useState(null);
  const [registeredIds, setRegisteredIds] = useState(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (!profileError && profile) {
            if (!cancelled) setCurrentUserRole(profile.role);
          }
        }

        const res = await fetch("/api/events");
        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        const data = await res.json();
        if (!cancelled) setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function refreshEvents() {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = events
    .filter((ev) => new Date(ev.event_date) >= today)
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

  const past = events
    .filter((ev) => new Date(ev.event_date) < today)
    .sort((a, b) => new Date(b.event_date) - new Date(a.event_date));

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          eventDate,
          requiresRegistration,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create event");
      }

      setShowModal(false);
      setName("");
      setDescription("");
      setEventDate("");
      setRequiresRegistration(false);
      await refreshEvents();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(eventId) {
    setRegisteringId(eventId);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setRegisteredIds((prev) => new Set(prev).add(eventId));
    } catch (e) {
      console.error(e);
    } finally {
      setRegisteringId(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Nav userName={null} />
      <main className="w-full flex-1 px-6 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">
                Connect EMEA
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">
                Events
              </h1>
            </div>
            {(currentUserRole === "intern" || currentUserRole === "admin") && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                >
                  Create event
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-10">
            <section>
              <h2 className="mb-5 text-2xl font-semibold tracking-tight text-gray-950">
                Upcoming
              </h2>

              {loading ? (
                <p className="text-sm text-gray-600">Loading events...</p>
              ) : upcoming.length === 0 ? (
                <p className="text-sm text-gray-500">No upcoming events</p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {upcoming.map((ev) => (
                    <li
                      key={ev.id}
                      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                    >
                      <h3 className="text-lg font-semibold tracking-tight text-gray-950">
                        {ev.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {new Date(ev.event_date).toLocaleDateString()}
                      </p>
                      {ev.description && (
                        <p className="mt-3 text-sm text-gray-700">
                          {ev.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-3">
                        {ev.requires_registration ? (
                          registeredIds.has(ev.id) ? (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-800">
                              Registered ✓
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRegister(ev.id)}
                              disabled={registeringId === ev.id}
                              className="rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
                            >
                              {registeringId === ev.id
                                ? "Registering..."
                                : "Register"}
                            </button>
                          )
                        ) : null}

                        {(currentUserRole === "intern" ||
                          currentUserRole === "admin") && (
                          <a
                            href={`/api/events/${ev.id}/export`}
                            className="inline-flex items-center rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-brand-200 hover:bg-brand-50"
                          >
                            Export CSV
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-5 text-2xl font-semibold tracking-tight text-gray-950">
                Past events
              </h2>

              {past.length === 0 ? (
                <p className="text-sm text-gray-500">No past events yet</p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {past.map((ev) => (
                    <li
                      key={ev.id}
                      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                    >
                      <h3 className="text-lg font-semibold tracking-tight text-gray-950">
                        {ev.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {new Date(ev.event_date).toLocaleDateString()}
                      </p>
                      {ev.description && (
                        <p className="mt-3 text-sm text-gray-700">
                          {ev.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-3">
                        {(currentUserRole === "intern" ||
                          currentUserRole === "admin") && (
                          <a
                            href={`/api/events/${ev.id}/export`}
                            className="inline-flex items-center rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-brand-200 hover:bg-brand-50"
                          >
                            Export CSV
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create event"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Event name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClassName}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Event date
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className={inputClassName}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={requiresRegistration}
              onChange={(e) => setRequiresRegistration(e.target.checked)}
              className="size-4 rounded border-gray-300 accent-brand-500 focus:ring-brand-500"
            />
            Requires pre-registration
          </label>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white"
            >
              {submitting ? "Creating..." : "Create event"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
