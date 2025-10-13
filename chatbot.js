// ====== Chatbot nổi góc dưới (v4 - Giao diện & Hiệu ứng nâng cao) ======
document.addEventListener("DOMContentLoaded", () => {
  // === 1. CSS cho giao diện & hiệu ứng ===
  const chatbotCSS = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0% { box-shadow: 0 4px 15px rgba(37, 117, 252, 0.4); }
      50% { box-shadow: 0 4px 25px rgba(37, 117, 252, 0.7); transform: scale(1.05); }
      100% { box-shadow: 0 4px 15px rgba(37, 117, 252, 0.4); }
    }
    .chatbot-message {
      animation: fadeIn 0.4s ease-out;
    }
    #chatbotBubble {
      animation: pulse 2.5s infinite;
    }
    #chatWindow {
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out;
      transform-origin: bottom right;
      transform: scale(0.95) translateY(10px);
      opacity: 0;
      pointer-events: none;
    }
    #chatWindow.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: auto;
    }
    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .typing-indicator span {
      height: 8px;
      width: 8px;
      background-color: #999;
      border-radius: 50%;
      display: inline-block;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }
  `;
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = chatbotCSS;
  document.head.appendChild(styleSheet);

  // === 2. Giao diện Chatbot (HTML) ===
  const chatHTML = `
    <div id="chatbotBubble"
      style="position:fixed;bottom:20px;right:20px;
      background:linear-gradient(135deg,#6a11cb,#2575fc);
      color:#fff;border-radius:50%;width:60px;height:60px;
      display:flex;align-items:center;justify-content:center;
      font-size:28px;cursor:pointer;z-index:9999;
      box-shadow:0 6px 20px rgba(0,0,0,0.3);">
      💬
    </div>

    <div id="chatWindow" style="
      position:fixed;bottom:90px;right:20px;width:380px;height:520px;
      background:#fff;border-radius:18px;
      display:flex;flex-direction:column;overflow:hidden;z-index:9999;
      box-shadow:0 8px 32px rgba(0,0,0,0.25);
      font-family:'Segoe UI',system-ui,sans-serif;">
      <div style="background:linear-gradient(90deg,#2575fc,#6a11cb);
        color:#fff;padding:12px;text-align:center;font-weight:600;
        letter-spacing:0.5px;">🤖 Tư vấn AI – Tương Lai Việt</div>
      <div id="chatMessages" style="flex:1;padding:12px;
        overflow-y:auto;background:#f8f9fb;font-size:0.9rem;line-height:1.5;"></div>
      <div style="display:flex;border-top:1px solid #ddd;">
        <input id="chatInput" type="text" placeholder="Nhập tin nhắn..."
          style="flex:1;padding:12px;border:none;outline:none;font-size:0.9rem;">
        <button id="sendBtn" style="background:#2575fc;color:#fff;
          border:none;padding:12px 16px;cursor:pointer;">Gửi</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", chatHTML);

  const chatBtn = document.getElementById("chatbotBubble");
  const chatWin = document.getElementById("chatWindow");
  const chatMessages = document.getElementById("chatMessages");
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");

  chatBtn.onclick = () => {
    chatWin.classList.toggle("open");
  };

  // === 3. Firestore cấu hình ===
  import("https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js").then(({ initializeApp }) => {
    import("https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js").then(({ getFirestore, collection, addDoc }) => {
      const firebaseConfig = {
        apiKey: "AIzaSyD7pbUtLE0w23EiH-bMEfTwASnxzSLAa",
        authDomain: "tuonglaiviet-c51d9.firebaseapp.com",
        projectId: "tuonglaiviet-c51d9",
      };
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);

      // === 4. Hàm gửi tin nhắn ===
      const PROXY_URL = "https://gemini-proxy-ashy-two.vercel.app/api/gemini";

      const sendMessage = async () => {
        const msg = input.value.trim();
        if (!msg) return;
        addMsg("user", msg);
        input.value = "";
        addTyping();
        try {
          const res = await fetch(PROXY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mbtiCode: msg })
          });
          const data = await res.json();
          const text = data?.result || data?.candidates?.[0]?.content?.parts?.[0]?.text || "Không có phản hồi.";
          removeTyping();
          addMsg("ai", text);
          await addDoc(collection(db, "chat_history"), {
            sender: "user",
            text: msg,
            time: new Date()
          });
          await addDoc(collection(db, "chat_history"), {
            sender: "ai",
            text,
            time: new Date()
          });
        } catch (err) {
          removeTyping();
          addMsg("ai", "❌ Lỗi kết nối: " + err.message);
        }
      };

      sendBtn.onclick = sendMessage;
      input.onkeydown = (e) => {
        if (e.key === "Enter") sendMessage();
      };

      // === 5. Hiển thị tin nhắn (với avatar + markdown) ===
      function addMsg(sender, text) {
        const wrap = document.createElement("div");
        wrap.className = "chatbot-message"; // Class for animation
        wrap.style.display = "flex";
        wrap.style.margin = "12px 0";
        wrap.style.alignItems = "flex-start";
        wrap.style.gap = "10px";

        const avatar = document.createElement("div");
        avatar.style.width = "32px";
        avatar.style.height = "32px";
        avatar.style.borderRadius = "50%";
        avatar.style.display = "flex";
        avatar.style.alignItems = "center";
        avatar.style.justifyContent = "center";
        avatar.style.fontSize = "18px";
        avatar.style.flexShrink = "0";

        const msg = document.createElement("div");
        msg.style.padding = "10px 14px";
        msg.style.borderRadius = "14px";
        msg.style.maxWidth = "80%";
        msg.style.whiteSpace = "pre-wrap";
        msg.style.lineHeight = "1.45";
        msg.style.boxShadow = "0 2px 5px rgba(0,0,0,0.08)";
        msg.innerHTML = renderMarkdown(text);

        if (sender === "user") {
          avatar.textContent = "👤";
          wrap.style.justifyContent = "flex-end";
          msg.style.background = "#2575fc";
          msg.style.color = "#fff";
          msg.style.borderRadius = "14px 14px 0 14px";
          // Order for user: message then avatar
          wrap.appendChild(msg);
          wrap.appendChild(avatar);
        } else {
          avatar.textContent = "🤖";
          msg.style.background = "#fff";
          msg.style.border = "1px solid #eee";
          msg.style.borderRadius = "14px 14px 14px 0";
          // Order for AI: avatar then message
          wrap.appendChild(avatar);
          wrap.appendChild(msg);
        }

        chatMessages.appendChild(wrap);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }

      // === 6. Hiệu ứng “AI đang gõ...” ===
      function addTyping() {
        const div = document.createElement("div");
        div.id = "typing";
        div.innerHTML = `<div style="margin:10px;display:flex;align-items:center;gap:10px;color:#999;">
          <div style="font-size:18px;">🤖</div>
          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>`;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }

      function removeTyping() {
        document.getElementById("typing")?.remove();
      }

      // === 7. Markdown cơ bản ===
      function renderMarkdown(md) {
        return md
          .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
          .replace(/\*(.*?)\*/g, "<i>$1</i>")
          .replace(/```([\s\S]*?)```/g, '<pre style="background:#efefef; padding:10px; border-radius:5px; white-space:pre-wrap; font-family:monospace;"><code>$1</code></pre>')
          .replace(/`([^`]+)`/g, '<code style="background:#efefef; padding:2px 5px; border-radius:3px;">$1</code>')
          .replace(/^\s*-\s(.*)/gm, '<li style="margin-left: 20px;">$1</li>')
          .replace(/\n/g, "<br>");
      }
    });
  });
});
