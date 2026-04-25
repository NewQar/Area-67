'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Language, UserProfile } from '@/lib/types';

const LANGUAGE_LABELS: Record<Language, string> = {
  ms: 'Bahasa Malaysia',
  en: 'English',
  zh: '中文',
  ta: 'தமிழ்',
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('aida.profile');
      if (raw) setProfile(JSON.parse(raw) as UserProfile);
    } catch {
      // ignore
    }
  }, []);

  function setLanguage(lang: Language) {
    if (!profile) return;
    const next = { ...profile, language: lang };
    setProfile(next);
    try {
      localStorage.setItem('aida.profile', JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function reset() {
    if (!confirm('Padam profil dan mula semula?')) return;
    try {
      localStorage.removeItem('aida.profile');
      localStorage.removeItem('aida.match');
    } catch {
      // ignore
    }
    router.push('/welcome');
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <p className="text-sm text-aida-muted">Profil belum dibuat.</p>
      </div>
    );
  }

  const initial = profile.name?.charAt(0).toUpperCase() ?? 'A';
  const incomeLabel = formatIncome(profile.monthlyIncome);

  return (
    <div className="flex-1 flex flex-col px-5 pt-5 pb-4">
      <header className="flex items-center gap-3">
        <div
          aria-hidden
          className="w-14 h-14 rounded-full bg-aida-blueLight text-aida-blue grid place-items-center text-xl font-bold"
        >
          {initial}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold truncate">{profile.name}</h1>
          <p className="text-xs text-aida-muted">
            {profile.age} tahun · {profile.state}
          </p>
        </div>
      </header>

      <section className="mt-5 rounded-2xl bg-white border border-black/5 p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-aida-muted mb-2">
          Maklumat asas
        </h2>
        <ul className="divide-y divide-black/5">
          <ProfileRow label="Pendapatan bulanan" value={incomeLabel} />
          <ProfileRow label="Bilangan ahli isi rumah" value={String(profile.householdSize)} />
          {typeof profile.numChildren === 'number' && (
            <ProfileRow label="Anak di bawah 18" value={String(profile.numChildren)} />
          )}
          {profile.gender && (
            <ProfileRow
              label="Jantina"
              value={profile.gender === 'male' ? 'Lelaki' : 'Perempuan'}
            />
          )}
          {profile.religion && (
            <ProfileRow
              label="Agama"
              value={profile.religion === 'islam' ? 'Islam' : 'Bukan Islam'}
            />
          )}
        </ul>
      </section>

      <section className="mt-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-aida-muted mb-2 px-1">
          Bahasa
        </h2>
        <div className="rounded-2xl bg-white border border-black/5 p-2">
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                aria-pressed={profile.language === lang}
                className={`min-h-[44px] rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  profile.language === lang
                    ? 'bg-aida-blue text-white'
                    : 'bg-black/5 text-aida-ink'
                }`}
              >
                {LANGUAGE_LABELS[lang]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-aida-muted mb-2 px-1">
          Tetapan
        </h2>
        <ul className="rounded-2xl bg-white border border-black/5 divide-y divide-black/5">
          <SettingItem icon="🔔" label="Notifikasi" sub="Peringatan permohonan" />
          <SettingItem icon="🔒" label="Privasi" sub="Bagaimana data anda dilindungi" />
          <SettingItem icon="ℹ️" label="Tentang AIDa" sub="Versi 0.1 · Hackathon Demo" />
        </ul>
      </section>

      <button
        type="button"
        onClick={reset}
        className="mt-6 w-full min-h-tap rounded-xl border-2 border-red-200 text-red-700 text-sm font-semibold active:scale-[0.99] transition"
      >
        Padam profil & mula semula
      </button>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
      <span className="text-aida-muted">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </li>
  );
}

function SettingItem({ icon, label, sub }: { icon: string; label: string; sub: string }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span aria-hidden className="text-lg">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-aida-muted">{sub}</p>
      </div>
      <span aria-hidden className="text-aida-muted text-sm">
        ›
      </span>
    </li>
  );
}

function formatIncome(income: number): string {
  if (income < 1000) return 'Kurang RM1,000';
  if (income < 2000) return 'RM1,000 – RM2,000';
  if (income < 3000) return 'RM2,000 – RM3,000';
  if (income < 4000) return 'RM3,000 – RM4,000';
  return 'Lebih RM4,000';
}
