import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("qr_token")
    .eq("id", user.id)
    .single();

  if (error || !profile?.qr_token) {
    return new Response("Unable to load QR code", {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const image = await QRCode.toBuffer(
    JSON.stringify({ type: "connect_emea_qr", token: profile.qr_token }),
    { type: "png" },
  );

  return new Response(image, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
