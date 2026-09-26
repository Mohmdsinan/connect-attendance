import { createClient } from "@/lib/supabase/server";

export default async function TestConnectionPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").limit(5);

  return <pre>{JSON.stringify(error ?? data, null, 2)}</pre>;
}
