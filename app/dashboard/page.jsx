import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const userName =
    profile?.name || user.user_metadata?.name || user.email || "Account";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Nav userName={userName} />
      <main className="w-full flex-1 px-6 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">
              Your Connect account
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">
              Welcome, {profile?.name || user.user_metadata?.name || "back"}
            </h1>
            <p className="mt-3 text-base leading-7 text-gray-600">
              Your event check-in pass is ready whenever you need it.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold tracking-tight text-gray-950">
                Your QR code
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Show this code at Connect EMEA events to check in.
              </p>
              <div className="mt-6 flex justify-center rounded-2xl bg-gray-50 p-4">
                <img
                  src="/api/qr"
                  alt="Attendance check-in QR code"
                  className="h-auto w-full max-w-64"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold tracking-tight text-gray-950">
                Account details
              </h2>
              <dl className="mt-6 divide-y divide-gray-100">
                <div className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:justify-between sm:gap-4">
                  <dt className="text-sm text-gray-500">Role</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {profile?.role || "—"}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 py-4 sm:flex-row sm:justify-between sm:gap-4">
                  <dt className="text-sm text-gray-500">Department</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {profile?.department || "—"}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 py-4 last:pb-0 sm:flex-row sm:justify-between sm:gap-4">
                  <dt className="text-sm text-gray-500">Student ID</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {profile?.student_id || "—"}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
