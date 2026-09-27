import { redirect } from "next/navigation";
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

  return (
    <main>
      <img src="/api/qr" alt="Attendance check-in QR code" />
      <p>Show this QR code at events for check-in.</p>
      <h1>Welcome, {profile?.name}</h1>
      <p>Role: {profile?.role}</p>
      <p>Department: {profile?.department}</p>
      <p>Student ID: {profile?.student_id}</p>
    </main>
  );
}
