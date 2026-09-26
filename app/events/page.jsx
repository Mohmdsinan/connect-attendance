"use client";

import { useEffect, useState } from "react";

const inputClassName =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

async function readJsonResponse(response) {
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || "Request failed");
  }

  return body;
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [requiresRegistration, setRequiresRegistration] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Events</h1>

        <section className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            Create event
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="eventName"
                className="mb-1 block text-sm font-medium text-gray-700"
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
                className="mb-1 block text-sm font-medium text-gray-700"
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
                className="mb-1 block text-sm font-medium text-gray-700"
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
                className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Requires pre-registration
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Creating event..." : "Create event"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Upcoming events
          </h2>
          {loading ? (
            <p className="text-sm text-gray-600">Loading events...</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-gray-600">No events found.</p>
          ) : (
            <ul className="space-y-4">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="rounded-2xl bg-white p-6 shadow-md"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {event.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {event.event_date}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                    {event.description}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
