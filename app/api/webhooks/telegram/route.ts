import { NextRequest, NextResponse } from "next/server";
import {
  updateRequestStatus,
  updateUserStatus,
  approveKasbonWithProof,
  rejectRequestWithReason,
} from "@/app/admin/actions";
import { sendTelegram } from "@/lib/telegram";
import { downloadTelegramFile } from "@/lib/telegram-photo";
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

    const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID;

    // Format: /kasbon 200000 buat servis motor -> pegawai ajukan kasbon langsung dari Telegram
    const kasbonMatch = text.match(/^\/kasbon\s+(\d+)\s+(.+)$/i);
    if (kasbonMatch && chatId !== adminChatId) {
      const amount = parseInt(kasbonMatch[1], 10);
      const reason = kasbonMatch[2].trim();

      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("telegram_chat_id", chatId)
        .eq("status", "active")
        .single();

      if (!user) {
        await sendTelegram(
          chatId,
          "⚠️ Chat ID kamu belum terdaftar/aktif. Daftar dulu di web, atau hubungi admin.",
        );
        return NextResponse.json({ ok: true });
      }

      const { data: newRequest, error } = await supabase
        .from("requests")
        .insert({ user_id: user.id, type: "kasbon", amount, reason, status: "pending" })
        .select()
        .single();

      if (error || !newRequest) {
        await sendTelegram(chatId, "⚠️ Gagal mengirim pengajuan kasbon, coba lagi.");
        return NextResponse.json({ ok: true });
      }

      await sendTelegram(
        chatId,
        `✅ Pengajuan kasbon Rp${amount.toLocaleString("id-ID")} sudah dikirim ke admin. Tunggu ya!`,
      );

      if (adminChatId) {
        await sendTelegram(
          adminChatId,
          `🔔 Pengajuan kasbon baru!\nDari: ${user.name}\nJumlah: Rp${amount.toLocaleString("id-ID")}\nAlasan: ${reason}\n\nID: #${newRequest.id}\n\nBalas cepat:\nACC ${newRequest.id} → setujui (kirim foto bukti transfer dengan caption ini biar sekalian terkirim ke pegawai)\nTOLAK ${newRequest.id} alasan → tolak dengan alasan`,
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Format: foto + caption "ACC {id}" -> admin ACC kasbon sekaligus kirim bukti transfer
    const photos = message.photo as { file_id: string }[] | undefined;
    const caption: string = (message.caption ?? "").trim();
    if (photos && photos.length > 0 && chatId === adminChatId) {
      const photoAccMatch = caption.match(/^ACC\s+(\d+)$/i);
      if (photoAccMatch) {
        const requestId = parseInt(photoAccMatch[1], 10);
        try {
          const fileId = photos[photos.length - 1].file_id; // resolusi tertinggi ada di elemen terakhir
          const { buffer, contentType } = await downloadTelegramFile(fileId);
          const result = await approveKasbonWithProof(requestId, buffer, contentType);

          await sendTelegram(
            adminChatId,
            result.success
              ? `✅ Pengajuan #${requestId} disetujui & bukti transfer sudah dikirim ke pegawai.`
              : `⚠️ ${result.message ?? "Gagal memproses approval."}`,
          );
        } catch (err) {
          console.error("Gagal proses ACC + bukti transfer:", err);
          await sendTelegram(adminChatId, "⚠️ Gagal download/upload foto bukti transfer, coba kirim ulang.");
        }
        return NextResponse.json({ ok: true });
      }
    }

    // Pastikan yang bales cuma admin yang terdaftar
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

    // Format: TOLAK 12 dana tidak cukup -> tolak pengajuan sekaligus kasih alasan
    const rejectMatch = text.match(/^TOLAK\s+(\d+)\s+(.+)$/i);
    if (rejectMatch) {
      const requestId = parseInt(rejectMatch[1], 10);
      const reason = rejectMatch[2].trim();

      const result = await rejectRequestWithReason(requestId, reason);
      await sendTelegram(
        adminChatId,
        result.success
          ? `❌ Pengajuan #${requestId} ditolak. Alasan sudah dikirim ke pegawai.`
          : `⚠️ ${result.message ?? "Gagal menolak pengajuan."}`,
      );
      return NextResponse.json({ ok: true });
    }

    // Format: ACC 12 / TOLAK 12 (tanpa bukti/alasan) -> approve/reject pengajuan biasa
    const requestMatch = text.match(/^(ACC|TOLAK)\s+(\d+)$/i);
    if (requestMatch) {
      const action = requestMatch[1].toUpperCase();
      const requestId = parseInt(requestMatch[2], 10);
      const status = action === "ACC" ? "approved" : "rejected";

      await updateRequestStatus(requestId, status);
      await sendTelegram(
        adminChatId,
        status === "approved"
          ? `✅ Pengajuan #${requestId} berhasil disetujui.\n(Tips: kirim foto bukti transfer dengan caption "ACC ${requestId}" biar bukti transfer otomatis terkirim ke pegawai)`
          : `❌ Pengajuan #${requestId} ditolak.\n(Tips: ketik "TOLAK ${requestId} <alasan>" biar pegawai tahu alasannya)`,
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