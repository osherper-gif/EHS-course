import 'dotenv/config';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN) {
  console.error("❌ אין TELEGRAM_BOT_TOKEN ב-.env.local");
  process.exit(1);
}

const url = `https://api.telegram.org/bot${TOKEN}/getUpdates`;

async function main() {
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.result || data.result.length === 0) {
      console.log("❗ אין updates.");
      console.log("👉 שלח הודעה בערוץ ואז הרץ שוב.");
      return;
    }

    for (const update of data.result) {
      if (update.message || update.channel_post) {
        const msg = update.message || update.channel_post;
        console.log("----");
        console.log("chat.id:", msg.chat.id);
        console.log("title:", msg.chat.title);
        console.log("type:", msg.chat.type);
        console.log("text:", msg.text);
      }
    }

  } catch (err) {
    console.error("❌ שגיאה:", err);
  }
}

main();