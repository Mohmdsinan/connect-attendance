"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENTS } from "@/lib/departments";

const inputClassName =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-500";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          student_id: studentId,
          department,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Nav authLink="/login" authLabel="Log in" />
      <main className="flex flex-1 items-start justify-center px-6 py-16 sm:px-8 sm:py-20">
        <section className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950">
            Create your account
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Join Connect to manage your attendance.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jane Doe"
                className={inputClassName}
              />
            </div>

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
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="jane@university.edu"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="studentId"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Admission Number
              </label>
              <input
                id="studentId"
                type="text"
                required
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                placeholder="e.g. 20ABCD101"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="department"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Department
              </label>
              <select
                id="department"
                required
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className={inputClassName}
              >
                <option value="" disabled>
                  Select department
                </option>
                {DEPARTMENTS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
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
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                className={inputClassName}
              />
            </div>

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
              disabled={loading}
              className="w-full rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              Log in
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
