// api/gemini.js
export default async function handler(req, res) {
  // ✅ Cho phép CORS để frontend truy cập
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end(); // phản hồi preflight
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST method only." });
  }

  try {
    const { mbtiCode } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Hãy phân tích tính cách MBTI ${mbtiCode} thật sâu sắc, nêu điểm mạnh, điểm yếu và 3 nghề nghiệp phù hợp.`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const analysis =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ Không có phản hồi từ Gemini.";

    res.status(200).json({ analysis });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}