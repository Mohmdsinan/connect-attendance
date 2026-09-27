import { createClient } from "@/lib/supabase/server";

export default async function TestConnectionPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").limit(5);

  return (
    <pre className="w-full overflow-x-auto whitespace-pre-wrap break-words px-4 py-4 text-sm">
      {JSON.stringify(error ?? data, null, 2)}
    </pre>
  );
}
