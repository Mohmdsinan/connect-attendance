"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const inputClassName =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-500";

async function loadAdminUsers(supabase) {
  const response = await fetch("/api/admin/users", { cache: "no-store" });

  if (response.status === 401 || response.status === 403) {
    await supabase.auth.signOut();
    return {
      authorized: false,
      users: [],
      error: "This account is not authorized to access the admin panel.",
    };
  }

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    return {
      authorized: false,
      users: [],
      error: result.error || "Unable to verify admin access.",
    };
  }

  const users = await response.json();
  return {
    authorized: true,
    users: Array.isArray(users) ? users : [],
    error: null,
  };
}

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [panelError, setPanelError] = useState(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function verifySession() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;
        if (!user) {
          if (active) setChecking(false);
          return;
        }

        const result = await loadAdminUsers(supabase);
        if (!active) return;

        setAuthorized(result.authorized);
        setUsers(result.users);
        setLoginError(result.error);
        setChecking(false);
      } catch {
        if (active) {
          setLoginError("Unable to verify your session. Please log in again.");
          setChecking(false);
        }
      }
    }

    verifySession();
    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setChecking(true);
    setLoginError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError(error.message);
      setChecking(false);
      return;
    }

    try {
      const result = await loadAdminUsers(supabase);
      setAuthorized(result.authorized);
      setUsers(result.users);
      setLoginError(result.error);
    } catch {
      setLoginError("Unable to verify admin access. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  async function handleLogout() {
    setChecking(true);
    const { error } = await createClient().auth.signOut();
    setAuthorized(false);
    setUsers([]);
    setEmail("");
    setPassword("");
    setSearch("");
    setLoginError(error?.message || null);
    setChecking(false);
  }

  async function handleRoleToggle(user) {
    const role = user.role === "intern" ? "student" : "intern";
    setUpdatingUserId(user.id);
    setPanelError(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPanelError(result.error || "Unable to update this user's role.");
        return;
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id ? { ...currentUser, role } : currentUser,
        ),
      );
    } catch {
      setPanelError("Unable to update this user's role. Please try again.");
    } finally {
      setUpdatingUserId(null);
    }
  }

  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();
    return (
      !query ||
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6">
        <p className="text-sm font-medium text-gray-600" role="status">
          Checking access...
        </p>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-start justify-center bg-white px-6 py-20 sm:px-8 sm:py-24">
        <section className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950">
            Admin log in
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Sign in with your administrator account.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="jane@university.edu"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                className={inputClassName}
              />
            </div>

            {loginError && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
              >
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              Log in
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">
              Connect
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
              User management
            </h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            Log out
          </button>
        </header>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
            <p className="text-sm text-gray-600">
              {filteredUsers.length}{" "}
              {filteredUsers.length === 1 ? "user" : "users"}
            </p>
            <input
              type="search"
              aria-label="Search users by name or email"
              placeholder="Search name or email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`${inputClassName} sm:max-w-xs`}
            />
          </div>

          {panelError && (
            <p
              role="alert"
              className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700 sm:px-6"
            >
              {panelError}
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th scope="col" className="px-5 py-3 sm:px-6">
                    Name
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Email
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Department
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Student ID
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Role
                  </th>
                  <th scope="col" className="px-5 py-3 sm:pr-6">
                    Access
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="text-sm text-gray-700">
                    <td className="px-5 py-4 font-medium text-gray-950 sm:px-6">
                      {user.name || "—"}
                    </td>
                    <td className="px-5 py-4">{user.email || "—"}</td>
                    <td className="px-5 py-4">{user.department || "—"}</td>
                    <td className="px-5 py-4">{user.student_id || "—"}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          user.role === "admin"
                            ? "bg-gray-900 text-white"
                            : user.role === "intern"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {user.role || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 sm:pr-6">
                      {user.role !== "admin" && (
                        <button
                          type="button"
                          disabled={updatingUserId === user.id}
                          onClick={() => handleRoleToggle(user)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-wait disabled:opacity-50"
                        >
                          {updatingUserId === user.id
                            ? "Updating..."
                            : user.role === "intern"
                              ? "Make student"
                              : "Make intern"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm text-gray-500"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
