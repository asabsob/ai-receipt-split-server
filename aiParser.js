const axios = require("axios");

async function parseReceiptWithGPT(base64Image) {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in reading receipts and returning structured JSON."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all purchased items as a JSON array. Include name, price (float), and quantity if shown. Only return raw JSON, no explanations or markdown."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  let content = response.data.choices[0].message.content;

  // ✅ Remove markdown formatting if present
  content = content.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(content);
  } catch (err) {
    console.error("🔴 JSON parsing failed. Raw content:", content);
    throw new Error("Failed to parse receipt with GPT");
  }
}

module.exports = { parseReceiptWithGPT };
