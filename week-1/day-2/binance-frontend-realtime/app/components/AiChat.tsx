"use client";

import { useMemo, useState, useEffect } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

const starterPrompts = [
  {
    label: "What does the chart say?",
    value: "What does the current price action for this market suggest?",
  },
  {
    label: "Support / resistance",
    value: "Where are the key support and resistance levels for this market?",
  },
  {
    label: "Trend strength",
    value: "Is this market in a bullish or bearish trend right now?",
  },
  {
    label: "Trade idea",
    value: "Give me a concise trade idea for this crypto pair.",
  },
];

async function getAssistantReply(message: string, market: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:3010/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, market }),
    });
    const data = await response.json();
    return data.reply || 'Sorry, I couldn\'t generate a response.';
  } catch (error) {
    console.error('Error fetching AI response:', error);
    return 'Error: Unable to connect to AI service.';
  }
}

export function AiChat({ market }: { market: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: `Hi there! I’m your open-source crypto conversation assistant for ${market.replace(
        "USDT",
        "/USDT"
      ).toUpperCase()}. Ask me about trend structure, levels, or smart trade ideas.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState("");
  const [fullTypingText, setFullTypingText] = useState("");

  const marketLabel = useMemo(
    () => market.replace("USDT", "/USDT").toUpperCase(),
    [market]
  );

  useEffect(() => {
    if (isTyping && currentTypingText.length < fullTypingText.length) {
      const timer = setTimeout(() => {
        setCurrentTypingText(fullTypingText.slice(0, currentTypingText.length + 1));
      }, 50); // Adjust speed here
      return () => clearTimeout(timer);
    } else if (isTyping && currentTypingText.length === fullTypingText.length) {
      setIsTyping(false);
      setMessages((current) => [...current, { role: "assistant", text: fullTypingText }]);
      setCurrentTypingText("");
      setFullTypingText("");
    }
  }, [isTyping, currentTypingText, fullTypingText]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userMessage = { role: "user", text: text.trim() };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsThinking(true);

    const assistantText = await getAssistantReply(text, marketLabel);
    setIsThinking(false);
    setFullTypingText(assistantText);
    setCurrentTypingText("");
    setIsTyping(true);
  };

  return (
    <div className="mt-4 rounded-[32px] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-1 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.85)]">
      <div className="rounded-[30px] bg-slate-950 px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.3em] text-emerald-300/80">
              Open Source AI Chat
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              Trade insights for {marketLabel}
            </div>
            <div className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Chat with a crypto assistant that helps you interpret price action, levels, and risk for this pair in real time.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-3xl bg-slate-900/80 p-3 text-center text-sm text-slate-300 shadow-inner shadow-slate-950/40 md:w-[320px]">
            <div className="rounded-2xl bg-slate-950/80 px-3 py-2">Trend</div>
            <div className="rounded-2xl bg-slate-950/80 px-3 py-2">Support</div>
            <div className="rounded-2xl bg-slate-950/80 px-3 py-2">Sentiment</div>
            <div className="rounded-2xl bg-slate-950/80 px-3 py-2">Levels</div>
          </div>
        </div>

        <div className="mt-5 max-h-[320px] overflow-y-auto rounded-[26px] border border-slate-800 bg-slate-950/80 p-4 shadow-[inset_0_1px_0_rgba(148,163,184,0.05)]">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`mb-4 flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                  message.role === "user"
                    ? "bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-400/20"
                    : "bg-slate-900 text-slate-200 ring-1 ring-slate-700/70"
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="flex max-w-[68%] items-center gap-2 rounded-3xl bg-slate-900 px-4 py-3 text-sm text-slate-300 ring-1 ring-slate-700/70">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                Thinking...
              </div>
            </div>
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[88%] rounded-3xl bg-slate-900 px-4 py-3 text-sm leading-6 text-slate-200 ring-1 ring-slate-700/70 shadow-sm">
                {currentTypingText}
                <span className="animate-pulse">|</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-[26px] border border-slate-800 bg-slate-900/90 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt.label}
                type="button"
                onClick={() => handleSend(prompt.value)}
                className="rounded-2xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200 transition hover:bg-slate-800 hover:text-white"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={2}
              placeholder={`Ask your AI about ${marketLabel}...`}
              className="min-h-[96px] flex-1 resize-none rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
            />
            <button
              type="button"
              onClick={() => handleSend(input)}
              disabled={isThinking || !input.trim()}
              className="inline-flex h-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-500 px-6 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isThinking ? "Generating..." : "Ask AI"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
