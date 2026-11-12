import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/cloudflare";
import { getRuntimeEnv } from "@/lib/runtime-env";

type TelegramUpdate = {
  message?: { text?: string; chat?: { id: number }; from?: { id: number } };
};

type TelegramTask = { id: string; title: string; status: string; department: string };

async function sendTelegramMessage(chatId: number, message: string) {
  const token = await getRuntimeEnv("TELEGRAM_BOT_TOKEN");
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message })
  });
  if (!response.ok) throw new Error(`Telegram sendMessage failed: ${response.status}`);
}

function helpText() {
  return [
    "ITCM GLOBAL AI — أوامر المالك",
    "/status — حالة الاتصالات",
    "/tasks — آخر المهام",
    "/task عنوان المهمة — إنشاء مهمة",
    "/done رقم المهمة — إتمام مهمة",
    "/help — المساعدة"
  ].join("\n");
}

export async function POST(request: NextRequest) {
  const expectedSecret = await getRuntimeEnv("TELEGRAM_WEBHOOK_SECRET");
  const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");
  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = await request.json() as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const message = update.message;
  const chatId = message?.chat?.id;
  const senderId = message?.from?.id;
  const text = message?.text?.trim();
  if (!chatId || !senderId || !text) return NextResponse.json({ ok: true, ignored: true });

  const ownerIds = (await getRuntimeEnv("TELEGRAM_OWNER_USER_IDS") ?? "")
    .split(",").map((value) => value.trim()).filter(Boolean);
  if (!ownerIds.includes(String(senderId))) {
    await sendTelegramMessage(chatId, "هذا البوت خاص بمالك ITCM GLOBAL AI. ليس لديك إذن لتنفيذ الأوامر.");
    return NextResponse.json({ ok: true, authorized: false });
  }

  try {
    if (text === "/start" || text === "/help") {
      await sendTelegramMessage(chatId, helpText());
      return NextResponse.json({ ok: true, command: "help" });
    }

    if (text === "/status") {
      const [db, aiKey, aiModel] = await Promise.all([
        getDatabase(), getRuntimeEnv("AI_API_KEY"), getRuntimeEnv("AI_MODEL")
      ]);
      await sendTelegramMessage(chatId, [
        "ITCM GLOBAL AI — الحالة",
        "Telegram webhook: active",
        `Database binding: ${db ? "detected" : "not configured"}`,
        `AI provider credentials: ${aiKey && aiModel ? "configured" : "not configured"}`,
        "Owner verification: active"
      ].join("\n"));
      return NextResponse.json({ ok: true, command: "status" });
    }

    if (text === "/tasks") {
      const db = await getDatabase();
      if (!db) {
        await sendTelegramMessage(chatId, "قاعدة البيانات غير مربوطة بعد. أضف D1 binding باسم DB وطبّق migration.");
        return NextResponse.json({ ok: true, command: "tasks", configured: false });
      }
      const result = await db.prepare(
        "SELECT id, title, status, department FROM tasks ORDER BY created_at DESC LIMIT 10"
      ).bind().all<TelegramTask>();
      const tasks = result.results ?? [];
      const lines = tasks.map((task) => `• ${task.title} [${task.status}] — ID: ${task.id}`);
      await sendTelegramMessage(chatId, tasks.length ? ["آخر المهام:", ...lines].join("\n") : "لا توجد مهام مسجلة حالياً.");
      return NextResponse.json({ ok: true, command: "tasks", count: tasks.length });
    }

    if (text.startsWith("/task")) {
      const title = text.slice(5).trim();
      if (!title || title.length > 120) {
        await sendTelegramMessage(chatId, "اكتب الأمر هكذا: /task عنوان المهمة (حتى 120 حرفاً).");
        return NextResponse.json({ ok: true, command: "task", created: false });
      }
      const db = await getDatabase();
      if (!db) {
        await sendTelegramMessage(chatId, "لم يتم إنشاء المهمة: قاعدة D1 غير مربوطة. أضف binding باسم DB وطبّق migration.");
        return NextResponse.json({ ok: true, command: "task", configured: false });
      }
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      await db.prepare(
        "INSERT INTO tasks (id, title, description, department, priority, status, created_at) VALUES (?, ?, '', 'Management', 'normal', 'pending', ?)"
      ).bind(id, title, createdAt).run();
      await sendTelegramMessage(chatId, `تم تسجيل المهمة في قاعدة البيانات.\nالعنوان: ${title}\nالحالة: pending\nID: ${id}`);
      return NextResponse.json({ ok: true, command: "task", created: true, id });
    }

    if (text.startsWith("/done")) {
      const id = text.slice(5).trim();
      if (!id || id.length > 80) {
        await sendTelegramMessage(chatId, "اكتب الأمر هكذا: /done رقم_المهمة");
        return NextResponse.json({ ok: true, command: "done", updated: false });
      }
      const db = await getDatabase();
      if (!db) {
        await sendTelegramMessage(chatId, "قاعدة البيانات غير مربوطة. لم يتم تعديل أي مهمة.");
        return NextResponse.json({ ok: true, command: "done", configured: false });
      }
      const result = await db.prepare("UPDATE tasks SET status = 'done' WHERE id = ?").bind(id).run();
      const changes = Number(result.meta?.changes ?? 0);
      await sendTelegramMessage(chatId, changes > 0 ? `تم إتمام المهمة: ${id}` : `لم أجد مهمة بهذا الرقم: ${id}`);
      return NextResponse.json({ ok: true, command: "done", updated: changes > 0 });
    }

    await sendTelegramMessage(chatId, "الأمر غير معروف. أرسل /help لعرض الأوامر المتاحة.");
    return NextResponse.json({ ok: true, command: "unknown" });
  } catch {
    await sendTelegramMessage(chatId, "وقع خطأ أثناء تنفيذ الأمر. لم أؤكد نجاح العملية؛ تحقق من إعدادات D1 وTelegram ثم أعد المحاولة.");
    return NextResponse.json({ error: "Command execution failed" }, { status: 500 });
  }
}
