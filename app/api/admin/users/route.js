import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/lib/supabase/server";

async function authorizeAdmin() {
  const sessionClient = await createSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return {
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (
    !configuredAdminEmail ||
    user.email?.toLowerCase() !== configuredAdminEmail
  ) {
    return { response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return {
      response: Response.json(
        { error: "Admin service is not configured" },
        { status: 500 },
      ),
    };
  }

  const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return {
      response: Response.json({ error: error.message }, { status: 500 }),
    };
  }

  if (profile?.role !== "admin") {
    return { response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { adminClient };
}

export async function GET() {
  const { adminClient, response } = await authorizeAdmin();
  if (response) return response;

  const profilesResult = await adminClient
    .from("profiles")
    .select("id, name, department, student_id, role");

  if (profilesResult.error) {
    return Response.json(
      { error: profilesResult.error.message },
      { status: 500 },
    );
  }

  const authUsers = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    authUsers.push(...data.users);
    if (data.users.length < 1000) break;
  }

  const emailsById = new Map(authUsers.map((user) => [user.id, user.email]));
  const users = profilesResult.data.map((profile) => ({
    ...profile,
    email: emailsById.get(profile.id) || "",
  }));

  return Response.json(users);
}

export async function PATCH(request) {
  const { adminClient, response } = await authorizeAdmin();
  if (response) return response;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { userId, role } = body ?? {};
  if (
    typeof userId !== "string" ||
    !userId.trim() ||
    !["student", "intern"].includes(role)
  ) {
    return Response.json(
      { error: "A userId and valid student or intern role are required" },
      { status: 400 },
    );
  }

  const { data: target, error: targetError } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (targetError) {
    return Response.json({ error: targetError.message }, { status: 500 });
  }

  if (!target) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  if (target.role === "admin") {
    return Response.json(
      { error: "Administrator roles cannot be changed here" },
      { status: 403 },
    );
  }

  const { data: updatedProfile, error: updateError } = await adminClient
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .neq("role", "admin")
    .select("id, role")
    .maybeSingle();

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  if (!updatedProfile) {
    return Response.json(
      { error: "Administrator roles cannot be changed here" },
      { status: 403 },
    );
  }

  return Response.json(updatedProfile);
}
