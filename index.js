// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs").promises;
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const { parseReceiptWithGPT } = require("./aiParser");

const app = express();
const PORT = 5000;
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

let receipts = {};

app.post("/upload", upload.single("receipt"), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const buffer = await fs.readFile(imagePath);
    const base64Image = buffer.toString("base64");

    const items = await parseReceiptWithGPT(base64Image);

    const receiptId = uuidv4();
    receipts[receiptId] = { id: receiptId, items };

    const qrUrl = `http://localhost:3000/receipt/${receiptId}`;
    const qrCode = await QRCode.toDataURL(qrUrl);

    res.json({ receiptId, items, qrCode, qrUrl });
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: "AI processing failed" });
  }
});

app.get("/receipt/:id", (req, res) => {
  const receipt = receipts[req.params.id];
  if (!receipt) return res.status(404).json({ error: "Not found" });
  res.json(receipt);
});

app.listen(PORT, () => console.log(`🟢 Backend on http://localhost:${PORT}`));
