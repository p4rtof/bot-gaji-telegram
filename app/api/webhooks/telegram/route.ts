import { NextRequest, NextResponse } from "next/server";
import { updateRequestStatus } from "@/app/admin/actions";
import { sendTelegram } from "@/lib/telegram";

// Telegram kirim payload webhook (Update object): { update_id, message: { from, chat, text, ... } }
export async function POST(req: NextRequest) {
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
  const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID; // simpan di .env
  if (!adminChatId || chatId !== adminChatId) {
    return NextResponse.json({ ok: true }); // abaikan, bukan dari admin
  }

  const match = text.match(/^(ACC|TOLAK)\s+(\d+)$/i);
  if (!match) {
    return NextResponse.json({ ok: true }); // bukan format command, abaikan
  }

  const [, action, idStr] = match;
  const requestId = parseInt(idStr, 10);
  const status = action.toUpperCase() === "ACC" ? "approved" : "rejected";

  await updateRequestStatus(requestId, status);

  return NextResponse.json({ ok: true });
}
