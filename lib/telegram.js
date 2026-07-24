async function fetchWithRetry(url, options, retries = 2, timeoutMs = 10000) {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      return res;
    } catch (err) {
      clearTimeout(timeout);
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendTelegram(chatId, message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  try {
    const res = await fetchWithRetry(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("Telegram sendMessage gagal:", data.description);
    }
    return data;
  } catch (err) {
    console.error("sendTelegram error:", err);
    return { ok: false, description: String(err) };
  }
}

// Kirim pesan dengan inline keyboard (tombol)
export async function sendTelegramWithButtons(chatId, message, buttons) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  try {
    const res = await fetchWithRetry(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttons },
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("Telegram sendMessage(buttons) gagal:", data.description);
    }
    return data;
  } catch (err) {
    console.error("sendTelegramWithButtons error:", err);
    return { ok: false, description: String(err) };
  }
}

// Wajib dipanggil setiap kali callback_query masuk, biar tombol gak "loading" terus
export async function answerCallbackQuery(callbackQueryId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  try {
    await fetchWithRetry(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
  } catch (err) {
    console.error("answerCallbackQuery error:", err);
  }
}

// Edit pesan setelah admin klik tombol, supaya tombol hilang & status kelihatan final
export async function editMessageAfterAction(chatId, messageId, newText) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  try {
    const res = await fetchWithRetry(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: newText,
        parse_mode: "HTML",
      }),
    });
    return await res.json();
  } catch (err) {
    console.error("editMessageAfterAction error:", err);
  }
}

export { escapeHtml };