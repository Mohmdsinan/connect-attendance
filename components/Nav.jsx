"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Nav({ userName, authLink, authLabel }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSignOut() {
    setError("");
    const supabase = createClient();
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="w-full px-4 sm:px-8">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-20 max-w-6xl items-center justify-between"
      >
        <Link
          href="/"
          aria-label="Connect EMEA home"
          className="relative h-10 w-32 overflow-hidden sm:w-56"
        >
          <Image
            src="/ConnectFullLogo.png"
            alt="Connect EMEA"
            width={1500}
            height={1500}
            priority
            className="h-10 w-32 object-cover sm:w-56"
          />
        </Link>

        {userName ? (
          <div className="flex min-w-0 items-center gap-2 sm:gap-5">
            <span className="max-w-24 truncate text-sm font-medium text-gray-700 sm:max-w-none">
              {userName}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-2xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-950"
            >
              Log out
            </button>
          </div>
        ) : authLink && authLabel ? (
          <Link
            href={authLink}
            className="rounded-2xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            {authLabel}
          </Link>
        ) : null}
      </nav>
      {error && (
        <p
          role="alert"
          className="mx-auto max-w-6xl pb-4 text-right text-sm text-red-600"
        >
          Could not log out: {error}
        </p>
      )}
    </header>
  );
}
