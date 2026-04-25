'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Aid, MatchResult, UserProfile } from '@/lib/types';
import aidsData from '@/data/aids.json';

const ALL_AIDS = aidsData as Aid[];

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Apa itu STR?',
  'Macam mana nak mohon?',
  'Bila duit masuk?',
  'Dokumen apa saya perlu?',
];

const GREETING: Record<string, string> = {
  ms: 'Helo! Saya AIDa. Ada apa yang saya boleh bantu hari ini?',
  en: "Hi! I'm AIDa. How can I help you today?",
  zh: '你好！我是AIDa。今天有什么我可以帮你的吗？',
  ta: 'வணக்கம்! நான் AIDa. இன்று உங்களுக்கு எப்படி உதவ முடியும்?',
};

export default function ChatInterface() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [matchedAids, setMatchedAids] = useState<Aid[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let p: UserProfile | null = null;
    let match: MatchResult | null = null;
    try {
      const rawProfile = localStorage.getItem('aida.profile');
      const rawMatch = localStorage.getItem('aida.match');
      if (rawProfile) p = JSON.parse(rawProfile) as UserProfile;
      if (rawMatch) match = JSON.parse(rawMatch) as MatchResult;
    } catch {
      // ignore
    }
    setProfile(p);
    if (match) {
      const aids = match.matched
        .map((m) => ALL_AIDS.find((a) => a.id === m.id))
        .filter(Boolean) as Aid[];
      setMatchedAids(aids);
    }
    const lang = (p?.language ?? 'ms') as keyof typeof GREETING;
    setMessages([{ role: 'assistant', content: GREETING[lang] ?? GREETING.ms }]);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const next: Msg[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          profile,
          matchedAids,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { reply: string };
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: 'Maaf, ada masalah teknikal. Cuba lagi sekejap.',
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <header className="sticky top-0 bg-white border-b border-black/5 px-4 py-3 flex items-center gap-3 z-10">
        <Link href="/dashboard" aria-label="Kembali" className="p-2 -ml-2 text-aida-ink">
          ←
        </Link>
        <div className="w-10 h-10 rounded-full bg-aida-green text-white grid place-items-center font-bold">
          A
        </div>
        <div>
          <p className="font-semibold leading-tight">AIDa</p>
          <p className="text-xs text-aida-muted">Pembantu bantuan anda</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-aida-bg">
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>
            {m.content}
          </Bubble>
        ))}
        {sending && (
          <Bubble role="assistant">
            <span className="inline-flex gap-1">
              <Dot delay="0ms" />
              <Dot delay="150ms" />
              <Dot delay="300ms" />
            </span>
          </Bubble>
        )}
      </div>

      <div className="border-t border-black/5 bg-white">
        <div className="px-4 pt-3 pb-2 flex gap-2 overflow-x-auto">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              disabled={sending}
              className="chip whitespace-nowrap"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          className="px-4 pb-4 pt-1 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            className="field flex-1"
            placeholder="Tulis soalan anda…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || input.trim().length === 0}
            className="min-h-tap px-5 rounded-2xl bg-aida-green text-white font-semibold disabled:opacity-50"
          >
            Hantar
          </button>
        </form>
      </div>
    </div>
  );
}

function Bubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-body shadow-sm ${
          isUser
            ? 'bg-white text-aida-ink rounded-br-md border border-black/5'
            : 'bg-aida-green text-white rounded-bl-md'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="w-2 h-2 rounded-full bg-white/80 animate-bounce"
      style={{ animationDelay: delay }}
    />
  );
}
