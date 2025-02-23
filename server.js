const express = require("express");
const cors = require("cors");
const axios = require("axios");
const admin = require("firebase-admin");

// 🔹 Thay YOUR_BOT_TOKEN và YOUR_CHAT_ID bằng thông tin của bạn
const TELEGRAM_BOT_TOKEN = "7776940680:AAEYxNOyhwdQxvdX_IWiI2tRN8t6CFs0lkw";
const TELEGRAM_CHAT_ID = "6765526662";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

// Khởi tạo Firebase
admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json")),
  databaseURL: "https://snappy-run-445210-p3-default-rtdb.asia-southeast1.firebasedatabase.app/",
});

const db = admin.database();
const app = express();
const PORT = 5000;

app.use(cors());
app.set("trust proxy", true);

// 1️⃣ API lấy IP, lưu Firebase và gửi Telegram
app.get("/get-ip-log", async (req, res) => {
  let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  ip = ip.replace(/^::ffff:/, ""); // Loại bỏ prefix IPv6 nếu có

  // Nếu IP là localhost, lấy IP thật từ API
  if (ip === "127.0.0.1" || ip === "::1") {
    try {
      const response = await axios.get("https://api64.ipify.org?format=json");
      ip = response.data.ip;
    } catch (error) {
      return res.status(500).json({ error: "Không thể lấy IP" });
    }
  }

  // Lưu IP vào Firebase
  const log = {
    ip: ip,
    timestamp: new Date().toISOString(),
  };

  try {
    await db.ref("ip_logs").push(log);

    // 🔹 Gửi IP qua Telegram
    const message = `📌 *New IP Logged* \n🌍 IP: \`${ip}\`\n🕒 Time: ${log.timestamp}`;
    await axios.post(TELEGRAM_API_URL, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    });

    res.json({ success: true, ip, log, message: "Đã gửi IP qua Telegram" });
  } catch (error) {
    res.status(500).json({ error: "Không thể lưu IP vào Firebase hoặc gửi Telegram" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});
