import Image from "next/image";
import Link from "next/link";
import ProfileMenu from "@/components/ProfileMenu";
import { createClient } from "@/lib/supabase/server";

const steps = [
  {
    number: "01",
    title: "Sign up once",
    description: "Create your Connect account in just a few minutes.",
  },
  {
    number: "02",
    title: "Get your QR code",
    description: "Your personal pass is ready whenever you need it.",
  },
  {
    number: "03",
    title: "Scan in at events",
    description: "Show your code at the door and get straight to the event.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-950">
      <header className="w-full px-6 sm:px-8">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-20 max-w-6xl items-center justify-between"
        >
          <Link
            href="/"
            aria-label="Connect EMEA home"
            className="relative h-10 w-56 overflow-hidden"
          >
            <Image
              src="/ConnectFullLogo.png"
              alt="Connect EMEA"
              width={1500}
              height={1500}
              priority
              className="h-10 w-56 object-cover"
            />
          </Link>

          {user ? (
            <ProfileMenu name={profile?.name || user.email} avatarUrl={null} />
          ) : (
            <div className="flex items-center gap-3 sm:gap-5">
              <Link
                href="/login"
                className="rounded-2xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-950"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-2xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-1">
        <section className="px-6 py-24 text-center sm:px-8 sm:py-32">
          <div className="mx-auto flex max-w-4xl flex-col items-center">
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">
              Connect EMEA event attendance
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl md:text-7xl">
              Attendance, simplified.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              One QR code. Every Connect EMEA event. No paperwork.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-2xl bg-brand-500 px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                Get started
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center justify-center rounded-2xl border border-brand-500 px-7 py-3.5 text-base font-semibold text-brand-600 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                View events
              </Link>
            </div>
          </div>
        </section>

        <section
          aria-label="How it works"
          className="px-6 py-20 sm:px-8 sm:py-24"
        >
          <div className="mx-auto grid max-w-5xl gap-8 border-t border-slate-200 pt-10 sm:grid-cols-3 sm:gap-10">
            {steps.map((step) => (
              <article key={step.number} className="rounded-2xl">
                <p className="text-sm font-semibold tracking-wide text-brand-500">
                  {step.number}
                </p>
                <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
                  {step.title}
                </h2>
                <p className="mt-2 text-base leading-7 text-slate-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="px-6 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between border-t border-slate-200 py-8">
          <Image
            src="/ConnectFullLogo.png"
            alt="Connect EMEA"
            width={1500}
            height={1500}
            className="h-6 w-40 object-cover grayscale opacity-70"
          />
          <p className="text-sm text-slate-500">© 2026 Connect EMEA</p>
        </div>
      </footer>
    </div>
  );
}
