"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";

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
  const [userName, setUserName] = useState("");
  const [accountError, setAccountError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [requiresRegistration, setRequiresRegistration] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) {
        return;
      }

      if (userError) {
        setAccountError(userError.message);
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      setUserName(user.email || "Account");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      if (!cancelled && profileError) {
        setAccountError(profileError.message);
      } else if (!cancelled && profile?.name) {
        setUserName(profile.name);
      }
    }

    loadAccount();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      try {
        const response = await fetch("/api/events");
        const data = await readJsonResponse(response);
        if (!cancelled) {
          setEvents(data);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshEvents() {
    try {
      const response = await fetch("/api/events");
      const data = await readJsonResponse(response);
      setEvents(data);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
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
      await readJsonResponse(response);

      setName("");
      setDescription("");
      setEventDate("");
      setRequiresRegistration(false);
      await refreshEvents();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Nav userName={userName || undefined} />
      <main className="w-full flex-1 px-6 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl space-y-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">
              Connect EMEA
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">
              Events
            </h1>
            <p className="mt-3 text-base leading-7 text-gray-600">
              Create and keep track of upcoming events.
            </p>
          </div>

          {accountError && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              Could not load your account: {accountError}
            </p>
          )}

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight text-gray-950">
              Create event
            </h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="eventName"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Event name
                </label>
                <input
                  id="eventName"
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="eventDate"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Event date
                </label>
                <input
                  id="eventDate"
                  type="date"
                  required
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                  className={inputClassName}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={requiresRegistration}
                  onChange={(event) =>
                    setRequiresRegistration(event.target.checked)
                  }
                  className="size-4 rounded border-gray-300 accent-brand-500 focus:ring-brand-500"
                />
                Requires pre-registration
              </label>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Creating event..." : "Create event"}
              </button>
            </form>
          </section>

          <section>
            <h2 className="mb-5 text-2xl font-semibold tracking-tight text-gray-950">
              Upcoming events
            </h2>
            {loading ? (
              <p className="text-sm text-gray-600">Loading events...</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-gray-600">No events found.</p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                  >
                    <h3 className="text-lg font-semibold tracking-tight text-gray-950">
                      {event.name}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-brand-600">
                      {event.event_date}
                    </p>
                    {event.description && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                        {event.description}
                      </p>
                    )}
                    <a
                      href={`/api/events/${event.id}/export`}
                      className="mt-5 inline-flex items-center rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                    >
                      Export CSV
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
