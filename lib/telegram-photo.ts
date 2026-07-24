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

// Download foto bukti transfer yang dikirim admin lewat Telegram.
// Alurnya: getFile (pakai file_id) -> dapat file_path -> fetch file-nya dari
// endpoint file.telegram.org.
export async function downloadTelegramFile(
  fileId: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN belum di-set di environment variables");
  }

  // 1. Minta file_path dari Telegram
  const getFileRes = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`,
  );
  if (!getFileRes.ok) {
    const errText = await getFileRes.text();
    throw new Error(`Gagal getFile dari Telegram: ${errText}`);
  }

  const getFileData = await getFileRes.json();
  const filePath: string | undefined = getFileData?.result?.file_path;
  if (!filePath) {
    throw new Error("Telegram tidak mengembalikan file_path");
  }

  // 2. Download file sebenarnya
  const fileRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
  if (!fileRes.ok) {
    throw new Error("Gagal download file dari Telegram");
  }

  const arrayBuffer = await fileRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Tebak content-type dari ekstensi file_path, fallback ke jpeg
  // (foto Telegram biasanya .jpg)
  const contentType =
    fileRes.headers.get("content-type") ??
    (filePath.endsWith(".png") ? "image/png" : "image/jpeg");

  return { buffer, contentType };
}