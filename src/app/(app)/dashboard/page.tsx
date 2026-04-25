'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import AidCard from '@/components/AidCard';
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
        return {
          aid,
          reason: m.reason,
          confidence: m.confidence,
          status: m.status,
          gap: m.gap,
          fixUrl: m.fix_url,
          estimatedDays: m.estimated_days,
        };
      })
      .filter(Boolean) as Array<{
        aid: Aid;
        reason: string;
        confidence: number;
        status?: MatchResult['matched'][number]['status'];
        gap?: string;
        fixUrl?: string;
        estimatedDays?: number;
      }>;
  }, [result]);

  const nearMissAids = useMemo(() => {
    if (!result) return [];
    return result.nearMiss
      .map((m) => {
        const aid = ALL_AIDS.find((a) => a.id === m.id);
        if (!aid) return null;
        return { aid, gap: m.gap, suggestion: m.suggestion, fixUrl: m.fix_url };
      })
      .filter(Boolean) as Array<{
        aid: Aid;
        gap: string;
        suggestion: string;
        fixUrl?: string;
      }>;
  }, [result]);

  const totalValue = useMemo(
    () =>
      matchedAids.reduce((sum, m) => {
        const headline = m.aid.amount.max_myr ?? m.aid.amount.min_myr;
        return sum + headline;
      }, 0),
    [matchedAids]
  );

  const firstName = profile?.name?.split(' ')[0] ?? '';

  return (
    <div className="flex-1 flex flex-col px-5 pt-5 pb-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-aida-muted">Selamat datang kembali</p>
          <h1 className="text-xl font-bold">Hai, {firstName || 'rakan'}</h1>
        </div>
        <div
          aria-hidden
          className="w-10 h-10 rounded-full bg-aida-greenLight text-aida-green grid place-items-center text-base font-bold"
        >
          {firstName.charAt(0).toUpperCase() || 'A'}
        </div>
      </header>

      {!loading && !error && result && matchedAids.length > 0 && (
        <section className="mt-5 rounded-2xl bg-gradient-to-br from-aida-green to-aida-greenDark text-white p-4 shadow-md">
          <p className="text-xs text-white/80 font-medium">Anggaran nilai bantuan</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">
            RM{totalValue.toLocaleString('en-MY')}
          </p>
          <p className="mt-1 text-xs text-white/80">
            Dari {matchedAids.length} bantuan yang anda mungkin layak
          </p>
        </section>
      )}

      {loading && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-aida-greenLight border-t-aida-green animate-spin" />
          <p className="text-sm text-aida-muted">AIDa sedang mencari padanan…</p>
        </div>
      )}

      {error && !loading && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">{error}</p>
          <button
            className="mt-3 text-sm text-red-800 font-semibold underline"
            onClick={() => location.reload()}
          >
            Cuba lagi
          </button>
        </div>
      )}

      {!loading && !error && result && (
        <>
          {matchedAids.length > 0 ? (
            <section className="mt-6">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-base font-bold">Untuk anda</h2>
                <span className="text-xs text-aida-muted">{matchedAids.length} bantuan</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {matchedAids.map((m) => (
                  <AidCard
                    key={m.aid.id}
                    aid={m.aid}
                    language={profile?.language}
                    status={m.status}
                  />
                ))}
              </div>
            </section>
          ) : (
            <div className="mt-6 rounded-2xl bg-white border border-black/5 p-4">
              <p className="text-sm">
                Belum ada padanan tepat. Cuba sembang dengan AIDa untuk panduan lanjut.
              </p>
            </div>
          )}

          {nearMissAids.length > 0 && (
            <section className="mt-7">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-base font-bold">Hampir layak</h2>
                <span className="text-xs text-aida-muted">{nearMissAids.length} bantuan</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {nearMissAids.map((n) => (
                  <AidCard
                    key={n.aid.id}
                    aid={n.aid}
                    language={profile?.language}
                    status="partial"
                  />
                ))}
              </div>
            </section>
          )}

          {result.nextSteps.length > 0 && (
            <section className="mt-7">
              <h2 className="text-base font-bold mb-3">Langkah seterusnya</h2>
              <ul className="space-y-2">
                {result.nextSteps.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 bg-white rounded-xl border border-black/5 p-3"
                  >
                    <span
                      aria-hidden
                      className="w-6 h-6 shrink-0 rounded-full bg-aida-green text-white grid place-items-center text-xs font-bold"
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm">{s}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
