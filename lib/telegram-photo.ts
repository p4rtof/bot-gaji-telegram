// Kirim foto/gambar lewat Telegram Bot API (sendPhoto).
// File terpisah dari lib/telegram.ts yang sudah ada, supaya tidak menimpa isinya.
// Cek dulu lib/telegram.ts kamu: kalau nama env var bot token-nya berbeda dari
// TELEGRAM_BOT_TOKEN, sesuaikan baris di bawah ini.

export async function sendTelegramPhoto(
  chatId: string,
  photo: Buffer,
  caption?: string,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN belum di-set di environment variables");
  }

  const form = new FormData();
  form.append("chat_id", chatId);
  if (caption) form.append("caption", caption);
  form.append(
    "photo",
    new Blob([new Uint8Array(photo)], { type: "image/png" }),
    "slip-gaji.png",
  );

  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal kirim foto ke Telegram: ${errText}`);
  }
}
