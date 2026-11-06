import { NextRequest, NextResponse } from "next/server";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id: number };
    from?: { id: number };
  };
};

async function sendTelegramMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });

  if (!response.ok) {
    throw new Error(`Telegram sendMessage failed: ${response.status}`);
  }
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = (await request.json()) as TelegramUpdate;
  const message = update.message;
  const chatId = message?.chat?.id;
  const senderId = message?.from?.id;
  const text = message?.text?.trim();

  if (!chatId || !senderId || !text) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const ownerIds = (process.env.TELEGRAM_OWNER_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!ownerIds.includes(String(senderId))) {
    await sendTelegramMessage(chatId, "هذا البوت خاص بمالك ITCM GLOBAL AI. ليس لديك إذن لتنفيذ الأوامر.");
    return NextResponse.json({ ok: true, authorized: false });
  }

  if (text === "/start") {
    await sendTelegramMessage(
      chatId,
      "مرحباً بك في ITCM GLOBAL AI. تم استلام اتصال Telegram والتحقق من حساب المالك. واجهة الأوامر الأساسية جاهزة؛ ربط الذكاء الاصطناعي وتنفيذ المهام سيُفعّل بعد إعداد مزود الذكاء الاصطناعي وقاعدة البيانات."
    );
  } else if (text === "/status") {
    await sendTelegramMessage(
      chatId,
      "ITCM GLOBAL AI\nTelegram webhook: active\nOwner authorization: active\nAI orchestration: not configured yet\nDatabase and task queue: not configured yet"
    );
  } else {
    await sendTelegramMessage(
      chatId,
      "وصلني أمرك، لكن محرك تنفيذ المهام لم يُربط بعد. حالياً الأوامر المتاحة هي /start و /status."
    );
  }

  return NextResponse.json({ ok: true });
}
