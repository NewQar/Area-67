'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import AidCard, { NearMissCard } from '@/components/AidCard';
import aidsData from '@/data/aids.json';
import type { Aid, MatchResult, UserProfile } from '@/lib/types';

const ALL_AIDS = aidsData as Aid[];

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem('aida.profile');
    } catch {
      stored = null;
    }
    if (!stored) {
      router.replace('/onboarding');
      return;
    }
    const parsed = JSON.parse(stored) as UserProfile;
    setProfile(parsed);

    fetch('/api/match', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ profile: parsed }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as MatchResult;
      })
      .then((data) => {
        setResult(data);
        try {
          localStorage.setItem('aida.match', JSON.stringify(data));
        } catch {
          // ignore
        }
      })
      .catch((e) => {
        console.error(e);
        setError('Tidak dapat memuatkan padanan. Cuba lagi.');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const matchedAids = useMemo(() => {
    if (!result) return [];
    return result.matched
      .map((m) => {
        const aid = ALL_AIDS.find((a) => a.id === m.id);
        if (!aid) return null;
        return { aid, reason: m.reason, confidence: m.confidence };
      })
      .filter(Boolean) as Array<{ aid: Aid; reason: string; confidence: number }>;
  }, [result]);

  const nearMissAids = useMemo(() => {
    if (!result) return [];
    return result.nearMiss
      .map((m) => {
        const aid = ALL_AIDS.find((a) => a.id === m.id);
        if (!aid) return null;
        return { aid, gap: m.gap, suggestion: m.suggestion };
      })
      .filter(Boolean) as Array<{ aid: Aid; gap: string; suggestion: string }>;
  }, [result]);

  const totalValue = useMemo(
    () => matchedAids.reduce((sum, m) => sum + m.aid.amount, 0),
    [matchedAids]
  );

  return (
    <div className="flex-1 flex flex-col px-5 py-5 pb-24">
      <header className="space-y-1 pt-2">
        <p className="text-sm text-aida-muted">
          {profile ? `Hai, ${profile.name}` : 'Hai!'}
        </p>
        <h1 className="text-3xl font-bold">Bantuan untuk anda</h1>
      </header>

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
          <div className="w-12 h-12 rounded-full border-4 border-aida-greenLight border-t-aida-green animate-spin" />
          <p className="text-body text-aida-muted">AIDa sedang mencari padanan…</p>
        </div>
      )}

      {error && !loading && (
        <div className="card mt-6 border-red-200 bg-red-50">
          <p className="text-red-800 font-semibold">{error}</p>
          <button className="btn-secondary mt-3" onClick={() => location.reload()}>
            Cuba lagi
          </button>
        </div>
      )}

      {!loading && !error && result && (
        <>
          {matchedAids.length > 0 && (
            <section className="mt-6 space-y-4">
              <div className="card bg-aida-greenLight border-aida-green/30">
                <p className="text-body font-semibold text-aida-greenDark">
                  Anda mungkin layak untuk {matchedAids.length} bantuan
                </p>
                <p className="text-amount font-bold text-aida-greenDark mt-1">
                  Sehingga RM{totalValue.toLocaleString('en-MY')}
                </p>
              </div>

              {matchedAids.map((m) => (
                <AidCard
                  key={m.aid.id}
                  aid={m.aid}
                  reason={m.reason}
                  confidence={m.confidence}
                />
              ))}
            </section>
          )}

          {matchedAids.length === 0 && (
            <div className="card mt-6">
              <p className="text-body">
                Belum ada padanan tepat. Cuba sembang dengan AIDa untuk panduan lanjut.
              </p>
            </div>
          )}

          {nearMissAids.length > 0 && (
            <section className="mt-8 space-y-3">
              <h2 className="text-xl font-bold">Hampir layak</h2>
              <p className="text-aida-muted text-body">
                Bantuan ini hampir sesuai. Berikut yang kurang:
              </p>
              {nearMissAids.map((n) => (
                <NearMissCard
                  key={n.aid.id}
                  aid={n.aid}
                  gap={n.gap}
                  suggestion={n.suggestion}
                />
              ))}
            </section>
          )}

          {result.nextSteps.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-bold mb-3">Langkah seterusnya</h2>
              <ul className="space-y-2">
                {result.nextSteps.map((s, i) => (
                  <li key={i} className="card flex items-start gap-3">
                    <span
                      aria-hidden
                      className="w-8 h-8 shrink-0 rounded-full bg-aida-green text-white grid place-items-center font-bold"
                    >
                      {i + 1}
                    </span>
                    <span className="text-body">{s}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <Link
        href="/chat"
        className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-md btn-primary shadow-lg"
        aria-label="Sembang dengan AIDa"
      >
        💬 Sembang dengan AIDa
      </Link>
    </div>
  );
}
