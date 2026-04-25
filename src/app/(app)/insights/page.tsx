'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProviderLogo } from '@/components/AidCard';
import aidsData from '@/data/aids.json';
import { getAidLogo } from '@/lib/logo';
import type { Aid, MatchResult, UserProfile } from '@/lib/types';

const ALL_AIDS = aidsData as Aid[];

const SPENDING_BREAKDOWN = [
  { label: 'Barangan dapur', amount: 320, percent: 42, color: 'bg-emerald-500' },
  { label: 'Utiliti & bil', amount: 180, percent: 24, color: 'bg-blue-500' },
  { label: 'Pengangkutan', amount: 140, percent: 18, color: 'bg-amber-500' },
  { label: 'Kesihatan', amount: 80, percent: 11, color: 'bg-purple-500' },
  { label: 'Lain-lain', amount: 40, percent: 5, color: 'bg-aida-muted' },
];

type AdviceTone = 'tip' | 'warn' | 'win';

const ADVICE: Array<{
  tone: AdviceTone;
  title: string;
  body: string;
}> = [
    {
      tone: 'win',
      title: 'Anda menjimatkan RM320 bulan ini',
      body: 'Penggunaan SARA untuk barangan dapur membantu anda kurangkan perbelanjaan tunai. Teruskan!',
    },
    {
      tone: 'tip',
      title: 'Cuba elakkan transaksi tarik tunai',
      body: 'Kredit MyKasih lebih jimat — tiada caj tarik tunai dan diskaun harga di kedai berdaftar.',
    },
    {
      tone: 'warn',
      title: 'STR akan dikreditkan ~20 Januari',
      body: 'Berdasarkan rekod, STR Fasa 1 akan masuk dalam ~30 hari. Sediakan akaun bank aktif.',
    },
  ];

const TONE_META: Record<
  AdviceTone,
  { bg: string; ring: string; text: string; accent: string }
> = {
  tip: { bg: 'bg-blue-50', ring: 'ring-blue-100', text: 'text-blue-900', accent: 'bg-blue-500' },
  warn: { bg: 'bg-amber-50', ring: 'ring-amber-100', text: 'text-amber-900', accent: 'bg-amber-500' },
  win: { bg: 'bg-emerald-50', ring: 'ring-emerald-100', text: 'text-emerald-900', accent: 'bg-emerald-500' },
};

export default function InsightsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);

  useEffect(() => {
    try {
      const rawProfile = localStorage.getItem('aida.profile');
      const rawMatch = localStorage.getItem('aida.match');
      if (rawProfile) setProfile(JSON.parse(rawProfile) as UserProfile);
      if (rawMatch) setMatch(JSON.parse(rawMatch) as MatchResult);
    } catch {
      // ignore
    }
  }, []);

  const creditedAids = useMemo(() => {
    if (!match) return [];
    return match.matched
      .map((m) => ALL_AIDS.find((a) => a.id === m.id))
      .filter(Boolean) as Aid[];
  }, [match]);

  const walletBalance = useMemo(
    () =>
      creditedAids.reduce((sum, a) => {
        const monthly =
          a.amount.max_myr && a.is_recurring ? Math.round(a.amount.max_myr / 12) : a.amount.min_myr;
        return sum + (monthly || 0);
      }, 0) + 218,
    [creditedAids]
  );

  const totalSpent = SPENDING_BREAKDOWN.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="flex-1 flex flex-col px-5 pt-5 pb-4">
      <header>
        <h1 className="text-xl font-bold">Insights</h1>
        <p className="text-xs text-aida-muted">Wawasan kewangan oleh AIDa</p>
      </header>

      <section className="mt-5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white p-4 shadow-md relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10"
        />
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-white grid place-items-center text-blue-700 font-black text-[10px]">
                TnG
              </div>
              <p className="text-xs text-white/90 font-semibold">Touch &apos;n Go eWallet</p>
            </div>
            <p className="mt-3 text-xs text-white/80">Baki bantuan</p>
            <p className="mt-0.5 text-3xl font-bold tracking-tight">
              RM{walletBalance.toLocaleString('en-MY')}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-white/10 backdrop-blur px-3 py-2">
            <p className="text-[10px] text-white/80">Diterima bulan ini</p>
            <p className="text-sm font-semibold">+RM{(walletBalance - 218).toLocaleString('en-MY')}</p>
          </div>
          <div className="rounded-lg bg-white/10 backdrop-blur px-3 py-2">
            <p className="text-[10px] text-white/80">Dibelanjakan</p>
            <p className="text-sm font-semibold">−RM{totalSpent}</p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-bold">Cadangan AIDa</h2>
          <span className="text-xs text-aida-muted"></span>
        </div>
        <div className="space-y-2.5">
          {ADVICE.map((a, i) => {
            const meta = TONE_META[a.tone];
            return (
              <div
                key={i}
                className={`rounded-2xl p-3.5 ring-1 ${meta.bg} ${meta.ring}`}
              >
                <div className="flex gap-2.5">
                  <span aria-hidden className={`mt-1 w-1 self-stretch rounded-full ${meta.accent}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${meta.text}`}>{a.title}</p>
                    <p className="mt-0.5 text-xs text-aida-ink/80">{a.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-bold mb-3">Corak perbelanjaan</h2>
        <div className="rounded-2xl bg-white border border-black/5 p-4">
          <div className="flex h-2 rounded-full overflow-hidden">
            {SPENDING_BREAKDOWN.map((s, i) => (
              <div
                key={i}
                className={s.color}
                style={{ width: `${s.percent}%` }}
                aria-label={`${s.label} ${s.percent}%`}
              />
            ))}
          </div>
          <ul className="mt-3 space-y-2">
            {SPENDING_BREAKDOWN.map((s, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span aria-hidden className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <span>{s.label}</span>
                </span>
                <span className="font-semibold tabular-nums">
                  RM{s.amount} <span className="text-xs text-aida-muted ml-1">{s.percent}%</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {creditedAids.length > 0 && (
        <section className="mt-6">
          <h2 className="text-base font-bold mb-3">Sumber bantuan aktif</h2>
          <div className="space-y-2">
            {creditedAids.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl bg-white border border-black/5 p-3"
              >
                <ProviderLogo src={getAidLogo(a.id)} fallback={a.provider} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {a.name[profile?.language ?? 'ms'] ?? a.name.ms}
                  </p>
                  <p className="text-xs text-aida-muted truncate">{a.provider}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-aida-blue">
                  +RM{a.amount.min_myr}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="mt-6 text-[11px] text-aida-muted text-center">
        * Data perbelanjaan dan baki adalah simulasi untuk demonstrasi.
      </p>
    </div>
  );
}
