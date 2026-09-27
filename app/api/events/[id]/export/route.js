import { createClient } from "@/lib/supabase/server";

function escapeCsvValue(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET(request, { params }) {
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
      { error: "Only interns can export attendance" },
      { status: 403 },
    );
  }

  const { id: eventId } = await params;
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("name")
    .eq("id", eventId)
    .single();

  if (eventError) {
    if (eventError.code === "PGRST116") {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }
    return Response.json({ error: eventError.message }, { status: 500 });
  }

  const { data: attendance, error: attendanceError } = await supabase
    .from("attendance")
    .select("checked_in_at, profiles(name, student_id, department)")
    .eq("event_id", eventId)
    .order("checked_in_at", { ascending: true });

  if (attendanceError) {
    return Response.json({ error: attendanceError.message }, { status: 500 });
  }

  const rows = [
    ["Name", "Admission Number", "Department", "Checked In At"].join(","),
    ...attendance.map((record) => {
      const joinedProfile = Array.isArray(record.profiles)
        ? record.profiles[0]
        : record.profiles;
      const formattedTime = new Date(record.checked_in_at).toLocaleString(
        "en-IN",
        {
          dateStyle: "medium",
          timeStyle: "short",
        },
      );

      return [
        joinedProfile?.name,
        joinedProfile?.student_id,
        joinedProfile?.department,
        formattedTime,
      ]
        .map(escapeCsvValue)
        .join(",");
    }),
  ];
  const csvString = rows.join("\n");
  const fileName = `${event.name.replace(/[^a-z0-9]/gi, "_")}_attendance.csv`;

  return new Response(csvString, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
