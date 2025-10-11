export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
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
    res.status(200).json({ result: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
