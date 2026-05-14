"use client";

import { useState, useRef, useCallback } from "react";
import { PRODUCTS } from "../lib/products.js";

const JHONATAN_AVATAR = "https://ui-avatars.com/api/?name=Jhonatan&background=25d366&color=fff&size=128&bold=true&font-size=0.4";

function formatCOP(price) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(price);
}

function ProductCard({ productId }) {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return null;
  return (
    <div className="product-card">
      <img src={product.imagen} alt={product.nombre} className="product-img" />
      <div className="product-info">
        <p className="product-name">{product.nombre}</p>
        <div className="product-prices">
          <span className="price-current">{formatCOP(product.precio)}</span>
          <span className="price-before">{formatCOP(product.precioAntes)}</span>
          <span className="price-badge">-{product.descuento}</span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isBot = message.role === "assistant";

  // Parse message for product image tags {{IMAGE:id}}
  const parseContent = (content) => {
    const parts = [];
    const regex = /\{\{IMAGE:([^}]+)\}\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", content: content.slice(lastIndex, match.index).trim() });
      }
      parts.push({ type: "image", productId: match[1] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      const remaining = content.slice(lastIndex).trim();
      if (remaining) parts.push({ type: "text", content: remaining });
    }

    return parts.length > 0 ? parts : [{ type: "text", content }];
  };

  const parts = parseContent(message.content);

  return (
    <div className={`message-row ${isBot ? "bot" : "user"}`}>
      {isBot && (
        <img src={JHONATAN_AVATAR} alt="Jhonatan" className="avatar" />
      )}
      <div className={`bubble-wrap ${isBot ? "bot" : "user"}`}>
        {parts.map((part, i) =>
          part.type === "image" ? (
            <ProductCard key={i} productId={part.productId} />
          ) : (
            <div key={i} className={`bubble ${isBot ? "bubble-bot" : "bubble-user"}`}>
              <p>{part.content}</p>
              <span className="time">
                {new Date(message.timestamp).toLocaleTimeString("es-CO", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {!isBot && <span className="check">✓✓</span>}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="message-row bot">
      <img src={JHONATAN_AVATAR} alt="Jhonatan" className="avatar" />
      <div className="bubble bubble-bot typing-bubble">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isProcessing = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendToGemini = useCallback(async (msgs) => {
    // Guard against concurrent calls
    if (isProcessing.current) return;
    isProcessing.current = true;

    // Fire API call immediately — runs in parallel with reading delay
    const apiPromise = fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs }),
    }).then((r) => r.json());

    // Reading delay before typing indicator — Jhonatan "lee" el mensaje primero
    const lastMsg = msgs[msgs.length - 1];
    const readingDelay = Math.min(1000 + lastMsg.content.length * 18, 2800);
    await new Promise((r) => setTimeout(r, readingDelay));

    setIsTyping(true);
    try {
      const data = await apiPromise;
      if (data.error) throw new Error(data.error);

      const parts = data.parts || ["Lo siento, hubo un error. ¿Puedes repetirlo?"];

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i > 0) {
          // Typing delay proporcional al largo del mensaje siguiente
          const delay = Math.min(700 + part.length * 30, 3000);
          await new Promise((r) => setTimeout(r, delay));
        }
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: part, timestamp: Date.now() },
        ]);
        if (i < parts.length - 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Ups, tuve un problema de conexión. ¿Me escribes de nuevo?",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
      isProcessing.current = false;
    }
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping || isProcessing.current) return;

    const userMsg = { role: "user", content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    inputRef.current?.focus();

    const historyForApi = [...messages, userMsg];

    await sendToGemini(historyForApi);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const visibleMessages = messages;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #111b21;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .phone-frame {
          width: 100%;
          max-width: 420px;
          height: 100vh;
          max-height: 900px;
          background: #0b1014;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 0;
          box-shadow: 0 25px 80px rgba(0,0,0,0.6);
          position: relative;
        }

        @media (min-width: 480px) {
          .phone-frame {
            border-radius: 20px;
            height: 92vh;
          }
        }

        /* ── HEADER ── */
        .chat-header {
          background: #202c33;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #2a3942;
          flex-shrink: 0;
          z-index: 10;
        }

        .header-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
        }

        .header-info { flex: 1; }

        .header-name {
          font-size: 16px;
          font-weight: 600;
          color: #e9edef;
          letter-spacing: 0.1px;
        }

        .header-status {
          font-size: 12px;
          color: #8696a0;
          margin-top: 1px;
        }

        .header-status.online { color: #25d366; }

        .header-logo {
          font-size: 11px;
          color: #8696a0;
          text-align: right;
          line-height: 1.3;
        }

        .header-logo strong { color: #25d366; display: block; font-size: 12px; }

        /* ── MESSAGES AREA ── */
        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 12px 8px;
          background: #0b1014;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          scroll-behavior: smooth;
        }

        .messages-area::-webkit-scrollbar { width: 4px; }
        .messages-area::-webkit-scrollbar-track { background: transparent; }
        .messages-area::-webkit-scrollbar-thumb { background: #2a3942; border-radius: 2px; }

        .date-divider {
          text-align: center;
          margin: 16px 0 8px;
        }

        .date-divider span {
          background: #182229;
          color: #8696a0;
          font-size: 11.5px;
          padding: 4px 10px;
          border-radius: 6px;
        }

        /* ── MESSAGE ROWS ── */
        .message-row {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          margin-bottom: 4px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .message-row.user { flex-direction: row-reverse; }
        .message-row.bot { flex-direction: row; }

        .avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          align-self: flex-end;
          margin-bottom: 2px;
        }

        .bubble-wrap {
          display: flex;
          flex-direction: column;
          gap: 3px;
          max-width: 75%;
        }

        .bubble-wrap.user { align-items: flex-end; }
        .bubble-wrap.bot { align-items: flex-start; }

        /* ── BUBBLES ── */
        .bubble {
          padding: 7px 10px 5px;
          border-radius: 7.5px;
          max-width: 100%;
          word-wrap: break-word;
          position: relative;
          line-height: 1.4;
        }

        .bubble-bot {
          background: #202c33;
          color: #e9edef;
          border-top-left-radius: 2px;
          font-size: 14.2px;
        }

        .bubble-user {
          background: #005c4b;
          color: #e9edef;
          border-top-right-radius: 2px;
          font-size: 14.2px;
        }

        .bubble p { margin: 0 28px 0 0; display: inline; }

        .time {
          font-size: 11px;
          color: #8696a0;
          float: right;
          margin-top: 1px;
          margin-left: 6px;
          white-space: nowrap;
          line-height: 1;
          position: relative;
          bottom: -1px;
        }

        .check {
          color: #53bdeb;
          margin-left: 3px;
          font-size: 12px;
        }

        /* ── TYPING ── */
        .typing-bubble {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 10px 14px;
          min-width: 52px;
        }

        .dot {
          width: 7px;
          height: 7px;
          background: #8696a0;
          border-radius: 50%;
          animation: bounce 1.2s infinite;
        }

        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }

        /* ── PRODUCT CARD ── */
        .product-card {
          background: #182229;
          border-radius: 10px;
          overflow: hidden;
          width: 230px;
          border: 1px solid #2a3942;
          animation: fadeIn 0.3s ease;
        }

        .product-img {
          width: 100%;
          height: 160px;
          object-fit: cover;
          display: block;
        }

        .product-info { padding: 10px 12px 12px; }

        .product-name {
          font-size: 12.5px;
          color: #e9edef;
          font-weight: 500;
          line-height: 1.35;
          margin-bottom: 8px;
        }

        .product-prices {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .price-current {
          font-size: 15px;
          font-weight: 700;
          color: #25d366;
        }

        .price-before {
          font-size: 11px;
          color: #8696a0;
          text-decoration: line-through;
        }

        .price-badge {
          background: #005c4b;
          color: #25d366;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        /* ── INPUT AREA ── */
        .input-area {
          background: #202c33;
          padding: 8px 12px;
          display: flex;
          align-items: flex-end;
          gap: 10px;
          border-top: 1px solid #2a3942;
          flex-shrink: 0;
        }

        .input-wrap {
          flex: 1;
          background: #2a3942;
          border-radius: 22px;
          padding: 9px 16px;
          display: flex;
          align-items: center;
          min-height: 44px;
        }

        .input-field {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #e9edef;
          font-size: 15px;
          line-height: 1.4;
          resize: none;
          max-height: 120px;
          font-family: inherit;
        }

        .input-field::placeholder { color: #8696a0; }

        .send-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #00a884;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s ease, transform 0.1s ease;
        }

        .send-btn:hover { background: #00c49a; }
        .send-btn:active { transform: scale(0.93); }
        .send-btn:disabled { background: #2a3942; cursor: default; }

        .send-btn svg { width: 20px; height: 20px; fill: white; }

        /* ── SCROLL ANCHOR ── */
        .scroll-anchor { height: 4px; }
      `}</style>

      <div className="phone-frame">
        {/* Header */}
        <div className="chat-header">
          <img src={JHONATAN_AVATAR} alt="Jhonatan" className="header-avatar" />
          <div className="header-info">
            <div className="header-name">Jhonatan</div>
            <div className={`header-status ${isTyping ? "" : "online"}`}>
              {isTyping ? "escribiendo..." : "en línea"}
            </div>
          </div>
          <div className="header-logo">
            <strong>Elegance</strong>
            Colombia
          </div>
        </div>

        {/* Messages */}
        <div className="messages-area">
          <div className="date-divider">
            <span>HOY</span>
          </div>
          {visibleMessages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} className="scroll-anchor" />
        </div>

        {/* Input */}
        <div className="input-area">
          <div className="input-wrap">
            <textarea
              ref={inputRef}
              className="input-field"
              placeholder="Escribe un mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
          </div>
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <svg viewBox="0 0 24 24">
              <path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
