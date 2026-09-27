import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile || !["intern", "admin"].includes(profile.role)) {
    return Response.json(
      { error: "Only interns can check students in" },
      { status: 403 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { qrToken, eventId } = body ?? {};
  if (
    typeof qrToken !== "string" ||
    !qrToken.trim() ||
    typeof eventId !== "string" ||
    !eventId.trim()
  ) {
    return Response.json(
      { error: "qrToken and eventId are required" },
      { status: 400 },
    );
  }

  const { data: event } = await supabase
    .from("events")
    .select("created_by")
    .eq("id", eventId)
    .single();

  if (!event) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  if (profile.role !== "admin" && event.created_by !== user.id) {
    return Response.json(
      {
        error:
          "Only the intern who created this event can scan attendance for it",
      },
      { status: 403 },
    );
  }

  const { data: student, error: studentError } = await supabase
    .from("profiles")
    .select("id, name, student_id, department")
    .eq("qr_token", qrToken)
    .maybeSingle();

  if (studentError) {
    return Response.json({ error: studentError.message }, { status: 500 });
  }

  if (!student) {
    return Response.json(
      { status: "not_found", error: "No account matches this QR code" },
      { status: 404 },
    );
  }

  const { data: existingAttendance, error: attendanceLookupError } =
    await supabase
      .from("attendance")
      .select("id")
      .eq("user_id", student.id)
      .eq("event_id", eventId)
      .maybeSingle();

  if (attendanceLookupError) {
    return Response.json(
      { error: attendanceLookupError.message },
      { status: 500 },
    );
  }

  if (existingAttendance) {
    return Response.json(
      {
        status: "already_checked_in",
        message: `${student.name} is already checked in`,
        student: { name: student.name, studentId: student.student_id },
      },
      { status: 200 },
    );
  }

  const { error: insertError } = await supabase.from("attendance").insert({
    user_id: student.id,
    event_id: eventId,
  });

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  return Response.json(
    {
      status: "checked_in",
      message: `${student.name} checked in successfully`,
      student: { name: student.name, studentId: student.student_id },
    },
    { status: 201 },
  );
}
