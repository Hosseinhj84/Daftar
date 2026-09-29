import { useEffect, useRef, useState } from "react";
import { Bot, MessageSquare, Plus, Send, Sparkles } from "lucide-react";
import apiClient from "../api/Client";
import Layout from "../Components/Layout";
import "../Styles/Chat.css";

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sending]);

  async function loadConversations() {
    try {
      setLoadingConversations(true);

      const response = await apiClient.get("/conversations/");
      setConversations(response.data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  }

  async function openConversation(id) {
    if (loadingMessages || sending) return;

    try {
      setActiveId(id);
      setLoadingMessages(true);

      const response = await apiClient.get(
        `/conversations/${id}/`
      );

      setMessages(response.data.messages || []);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    } finally {
      setLoadingMessages(false);
    }
  }

  function startNewConversation() {
    if (sending) return;

    setActiveId(null);
    setMessages([]);
    setInput("");

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  }

  function handleInputChange(e) {
    setInput(e.target.value);

    const textarea = e.target;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      140
    )}px`;
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (!sending) {
        handleSend(e);
      }
    }
  }

  async function handleSend(e) {
    e?.preventDefault();

    const messageText = input.trim();

    if (!messageText || sending) return;

    setSending(true);
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      let conversationId = activeId;

      if (!conversationId) {
        const createResponse = await apiClient.post(
          "/conversations/",
          {}
        );

        conversationId = createResponse.data.id;

        setActiveId(conversationId);
      }

      const response = await apiClient.post(
        `/conversations/${conversationId}/send/`,
        {
          message: messageText,
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.data.reply,
        },
      ]);

      await loadConversations();
    } catch (error) {
      console.error("Failed to send message:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "error",
          content:
            "در دریافت پاسخ مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
        },
      ]);
    } finally {
      setSending(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }

  function useSuggestion(text) {
    setInput(text);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  }

  return (
    <Layout>
      <div className="chat-layout">

        {/* Conversations */}
        <aside className="chat-sidebar">

          <div className="chat-sidebar-header">
            <div>
              <h2>گفتگوها</h2>
              <span>دستیار هوشمند دفتر</span>
            </div>

            <div className="chat-sidebar-icon">
              <MessageSquare size={18} />
            </div>
          </div>

          <button
            type="button"
            className="chat-new-btn"
            onClick={startNewConversation}
            disabled={sending}
          >
            <Plus size={18} />
            <span>گفتگوی جدید</span>
          </button>

          <div className="chat-conversations">
            {loadingConversations ? (
              <div className="chat-sidebar-loading">
                <span className="chat-spinner" />
                در حال بارگذاری...
              </div>
            ) : conversations.length === 0 ? (
              <div className="chat-no-conversations">
                هنوز گفتگویی ندارید.
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  type="button"
                  key={conv.id}
                  className={
                    activeId === conv.id
                      ? "chat-conv-item active"
                      : "chat-conv-item"
                  }
                  onClick={() => openConversation(conv.id)}
                >
                  <MessageSquare size={16} />

                  <span>
                    {conv.title || "گفتگوی بدون عنوان"}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main chat */}
        <main className="chat-main">

          <header className="chat-header">
            <div className="chat-header-avatar">
              <Bot size={20} />
            </div>

            <div>
              <h1>دستیار هوشمند</h1>
              <span>
                تحلیل اطلاعات و گزارش‌های دفتر
              </span>
            </div>
          </header>

          <div className="chat-messages">

            {messages.length === 0 && !loadingMessages ? (
              <div className="chat-empty">

                <div className="chat-empty-icon">
                  <Sparkles size={28} />
                </div>

                <h2>
                  چه چیزی می‌خواهید بررسی کنیم؟
                </h2>

                <p>
                  درباره وضعیت مالی، فروش، مشتریان یا
                  گزارش‌های دفتر سؤال بپرسید.
                </p>

                <div className="chat-suggestions">

                  <button
                    type="button"
                    onClick={() =>
                      useSuggestion(
                        "فروش این ماه چقدر بوده؟"
                      )
                    }
                  >
                    فروش این ماه چقدر بوده؟
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      useSuggestion(
                        "پرفروش‌ترین محصولات من کدام‌اند؟"
                      )
                    }
                  >
                    پرفروش‌ترین محصولات من کدام‌اند؟
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      useSuggestion(
                        "وضعیت فاکتورهای پرداخت‌نشده چیست؟"
                      )
                    }
                  >
                    وضعیت فاکتورهای پرداخت‌نشده چیست؟
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      useSuggestion(
                        "یک خلاصه از وضعیت مالی من بده"
                      )
                    }
                  >
                    خلاصه وضعیت مالی
                  </button>

                </div>
              </div>
            ) : loadingMessages ? (
              <div className="chat-loading-messages">
                <span className="chat-spinner" />
                در حال دریافت گفتگو...
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-message-row ${message.role}`}
                  >
                    {message.role === "assistant" && (
                      <div className="chat-message-avatar">
                        <Bot size={16} />
                      </div>
                    )}

                    <div
                      className={`chat-bubble ${message.role}`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="chat-message-row assistant">
                    <div className="chat-message-avatar">
                      <Bot size={16} />
                    </div>

                    <div className="chat-bubble assistant typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}
              </>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            className="chat-composer"
            onSubmit={handleSend}
          >
            <div className="chat-input-wrapper">

              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="سؤال خود را درباره دفتر بنویسید..."
                rows={1}
                disabled={sending}
              />

              <button
                type="submit"
                className="chat-send-btn"
                disabled={!input.trim() || sending}
                aria-label="ارسال پیام"
              >
                <Send size={18} />
              </button>

            </div>

            <div className="chat-composer-hint">
              Enter برای ارسال · Shift + Enter برای خط جدید
            </div>
          </form>

        </main>
      </div>
    </Layout>
  );
}