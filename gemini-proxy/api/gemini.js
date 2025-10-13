// api/gemini.js — Bản nâng cao: xử lý cả MBTI & tóm tắt bài viết với prompt chi tiết
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST only." });

  try {
    const body = req.body || {};
    const prompt =
      body.prompt ||
      body.mbtiCode ||
      body.contents?.[0]?.parts?.[0]?.text ||
      "Xin chào, bạn là ai?";

    const user = body.user || {};
    const name = user.name || "Người dùng";
    const age = user.age || "Không rõ";
    const gender = user.gender || "Không rõ";

    // 💬 Prompt chi tiết, chuyên biệt cho MBTI và tóm tắt
    const fullPrompt = `
Bạn là **Tương Lai Việt AI**, một trợ lý AI thông minh và thân thiện, chuyên về tư vấn hướng nghiệp và phân tích tính cách. 
Luôn sử dụng giọng văn tự nhiên, chuyên nghiệp, gần gũi và giàu cảm xúc.

---

### 1️⃣ Nếu nội dung là mã MBTI (ví dụ: INFP, ESTJ...):
Phân tích chi tiết theo cấu trúc sau:
- **Tổng quan tính cách:** Giải thích đặc điểm nổi bật của nhóm này.
- **Điểm mạnh:** Liệt kê 3–5 ưu điểm chính, giải thích ngắn gọn.
- **Điểm yếu:** Nêu 3 hạn chế hoặc thách thức thường gặp.
- **Ngành nghề phù hợp:** Gợi ý 3 nhóm nghề cụ thể, kèm lý do.
- **Lời khuyên cá nhân hóa:** Dựa trên tuổi (${age}) và giới tính (${gender}), đưa ra lời khuyên riêng giúp phát huy thế mạnh và cân bằng cuộc sống.

---

### 2️⃣ Nếu nội dung là một đoạn văn hoặc bài viết:
Hãy **tóm tắt nội dung bài viết** một cách:
- Rõ ràng, cô đọng (khoảng 120–180 từ).
- Trình bày có gạch đầu dòng hoặc chia đoạn.
- Giữ văn phong tự nhiên, mạch lạc, dễ đọc.
- Nhấn mạnh ý chính, kết luận, hoặc thông điệp chính của bài viết.

---

Ngữ cảnh người dùng:
- Họ tên: ${name}
- Tuổi: ${age}
- Giới tính: ${gender}

Nội dung yêu cầu:
${prompt}
`;

    // ===== Gọi Gemini API =====
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
        }),
      }
    );

    const data = await r.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") ||
      "⚠️ Không có phản hồi từ Gemini.";

    return res.status(200).json({ result: text, raw: data });
  } catch (err) {
    console.error("Gemini Proxy error:", err);
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
};
