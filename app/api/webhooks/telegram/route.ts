import { NextRequest, NextResponse } from "next/server";
import { updateRequestStatus, updateUserStatus } from "@/app/admin/actions";
import { sendTelegram } from "@/lib/telegram";
import { supabase } from "@/lib/supabase";

// Telegram kirim payload webhook (Update object): { update_id, message: { from, chat, text, ... } }
export async function POST(req: NextRequest) {
  try {
    // Keamanan: verifikasi request beneran dari Telegram (kalau sudah set secret_token saat setWebhook)
    const secret = req.headers.get("x-telegram-bot-api-secret-token");
    if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ ok: true });
    }

    const body = await req.json();
    const message = body.message;
    if (!message) {
      return NextResponse.json({ ok: true }); // bukan pesan (mis. edited_message dll), abaikan
    }

    const chatId: string = String(message.chat?.id ?? "");
    const text: string = (message.text ?? "").trim();

    // Kalau user baru ketik /start, balas chat_id-nya biar bisa dipakai saat daftar akun
    if (text === "/start") {
      await sendTelegram(
        chatId,
        `Halo! Chat ID kamu adalah:\n\`${chatId}\`\n\nGunakan Chat ID ini saat mendaftar akun di aplikasi.`,
      );
      return NextResponse.json({ ok: true });
    }

    // Pastikan yang bales cuma admin yang terdaftar
    const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
    if (!adminChatId || chatId !== adminChatId) {
      return NextResponse.json({ ok: true }); // abaikan, bukan dari admin
    }

    // Format: ACC U6 / TOLAK U6 -> approve/reject akun karyawan (pakai short_id)
    const userMatch = text.match(/^(ACC|TOLAK)\s+U(\d+)$/i);
    if (userMatch) {
      const action = userMatch[1].toUpperCase();
      const shortId = Number(userMatch[2]);

      const { data: targetUser } = await supabase
        .from("users")
        .select("id, name")
        .eq("short_id", shortId)
        .single();

      if (!targetUser) {
        await sendTelegram(adminChatId, `⚠️ Akun dengan ID U${shortId} tidak ditemukan.`);
        return NextResponse.json({ ok: true });
      }

      await updateUserStatus(targetUser.id, action === "ACC" ? "active" : "rejected");
      await sendTelegram(
        adminChatId,
        action === "ACC"
          ? `✅ Akun U${shortId} (${targetUser.name}) berhasil disetujui.`
          : `❌ Akun U${shortId} (${targetUser.name}) ditolak.`,
      );
      return NextResponse.json({ ok: true });
    }

    // Format: ACC 12 / TOLAK 12 -> approve/reject pengajuan kasbon
    const requestMatch = text.match(/^(ACC|TOLAK)\s+(\d+)$/i);
    if (requestMatch) {
      const action = requestMatch[1].toUpperCase();
      const requestId = parseInt(requestMatch[2], 10);
      const status = action === "ACC" ? "approved" : "rejected";

      await updateRequestStatus(requestId, status);
      await sendTelegram(
        adminChatId,
        status === "approved"
          ? `✅ Pengajuan #${requestId} berhasil disetujui.`
          : `❌ Pengajuan #${requestId} ditolak.`,
      );
      return NextResponse.json({ ok: true });
    }

    // Command tidak dikenali -> diamkan saja
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: true }); // tetap 200 supaya Telegram gak retry terus
  }
}