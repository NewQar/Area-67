'use client';

import { useEffect, useMemo, useState } from 'react';
import AidCard from '@/components/AidCard';
import aidsData from '@/data/aids.json';
import type { Aid, MatchResult, UserProfile } from '@/lib/types';

const ALL_AIDS = (aidsData as Aid[]).filter((a) => a.is_active !== false);

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Semua',
  cash: 'Tunai',
  cash_voucher: 'Baucar',
  in_kind: 'Barangan',
  zakat: 'Zakat',
  education: 'Pendidikan',
  caregiver: 'Penjaga',
  maternal: 'Ibu & anak',
  family_welfare: 'Kebajikan',
  retiree: 'Persaraan',
  insurance: 'Insurans',
  registration_gate: 'Pendaftaran',
};

export default function AidsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
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

  const matchStatusById = useMemo(() => {
    const map = new Map<string, 'eligible' | 'partial' | 'auto'>();
    if (!match) return map;
    for (const m of match.matched) {
      map.set(m.id, m.status ?? 'eligible');
    }
    for (const m of match.nearMiss) {
      map.set(m.id, 'partial');
    }
    return map;
  }, [match]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    ALL_AIDS.forEach((a) => set.add(a.category));
    return ['all', ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_AIDS.filter((a) => {
      if (category !== 'all' && a.category !== category) return false;
      if (!q) return true;
      const lang = profile?.language ?? 'ms';
      const name = (a.name[lang] ?? a.name.ms).toLowerCase();
      return name.includes(q) || a.provider.toLowerCase().includes(q);
    });
  }, [query, category, profile]);

  return (
    <div className="flex-1 flex flex-col px-5 pt-5">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">Senarai Bantuan</h1>
        <p className="text-xs text-aida-muted">{ALL_AIDS.length} program tersedia</p>
      </header>

      <div className="mt-4 relative">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="absolute left-3 top-1/2 -translate-y-1/2 text-aida-muted"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari bantuan…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 bg-white text-sm focus:outline-none focus:border-aida-green"
        />
      </div>

      <div className="mt-3 -mx-5 px-5 flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
              category === c
                ? 'bg-aida-green text-white'
                : 'bg-white text-aida-ink border border-black/10'
            }`}
          >
            {CATEGORY_LABELS[c] ?? c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 text-center text-sm text-aida-muted py-10">
          Tiada bantuan dijumpai.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {filtered.map((aid) => (
            <AidCard
              key={aid.id}
              aid={aid}
              language={profile?.language}
              status={matchStatusById.get(aid.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
