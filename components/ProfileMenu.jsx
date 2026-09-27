"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function ProfileMenu({ name, avatarUrl }) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  async function handleSignOut() {
    setError("");
    const supabase = createClient();
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Open profile menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-brand-500 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          getInitials(name)
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-2 min-w-40 rounded-2xl border border-gray-100 bg-white py-2 shadow-sm"
        >
          <Link
            href="/dashboard"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            Dashboard
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            Log out
          </button>
          {error && (
            <p role="alert" className="px-4 py-2 text-xs text-red-600">
              Could not log out: {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
