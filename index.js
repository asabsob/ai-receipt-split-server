// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const { parseReceiptWithGPT } = require("./aiParser");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Use memory storage for Render compatibility
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: "*" })); // You can replace * with specific domain later
app.use(express.json());

let receipts = {};

app.post("/upload", upload.single("receipt"), async (req, res) => {
  try {
    // ✅ Convert buffer to base64
    const base64Image = req.file.buffer.toString("base64");

    // 🧠 Extract items with GPT
    const items = await parseReceiptWithGPT(base64Image);

    // 🧾 Store and generate ID
    const receiptId = uuidv4();
    receipts[receiptId] = { id: receiptId, items };

    // 🔗 Generate dynamic QR URL
    const origin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrUrl = `${origin}/receipt/${receiptId}`;
    const qrCode = await QRCode.toDataURL(qrUrl);

    res.json({ receiptId, items, qrCode, qrUrl });
  } catch (err) {
    console.error("AI error:", err.message);
    res.status(500).json({ error: "AI processing failed" });
  }
});

app.get("/receipt/:id", (req, res) => {
  const receipt = receipts[req.params.id];
  if (!receipt) return res.status(404).json({ error: "Not found" });
  res.json(receipt);
});

app.listen(PORT, () => console.log(`🟢 Backend on http://localhost:${PORT}`));
