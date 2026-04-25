'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ProviderLogo } from '@/components/AidCard';
import aidsData from '@/data/aids.json';
import { getAidLogo } from '@/lib/logo';
import type { Aid, Language, MatchResult, MatchStatus, UserProfile } from '@/lib/types';

const ALL_AIDS = aidsData as Aid[];

const STATUS_META: Record<
  MatchStatus,
  { label: string; className: string; icon: string }
> = {
  eligible: {
    label: 'Anda layak',
    className: 'bg-aida-blueLight text-aida-blueDark border-aida-blue/30',
    icon: '✓',
  },
  partial: {
    label: 'Hampir layak',
    className: 'bg-yellow-50 text-yellow-900 border-yellow-300',
    icon: '⚠',
  },
  auto: {
    label: 'Auto — tiada permohonan',
    className: 'bg-aida-blueLight text-aida-blueDark border-aida-blue/30',
    icon: '⚡',
  },
};

function localizedName(aid: Aid, language: Language): string {
  return aid.name[language] || aid.name.ms;
}

function formatAmountRange(aid: Aid): string {
  const { min_myr, max_myr } = aid.amount;
  if (min_myr === 0 && (max_myr === 0 || max_myr == null)) return '';
  if (max_myr == null || max_myr === min_myr) return `RM${min_myr.toLocaleString('en-MY')}`;
  return `RM${min_myr.toLocaleString('en-MY')} – RM${max_myr.toLocaleString('en-MY')}`;
}

export default function AidDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const aidId = params?.id;

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

  const aid = useMemo(() => ALL_AIDS.find((a) => a.id === aidId) ?? null, [aidId]);

  const matchInfo = useMemo(() => {
    if (!match || !aid) return null;
    const matched = match.matched.find((m) => m.id === aid.id);
    if (matched) return { kind: 'matched' as const, ...matched };
    const near = match.nearMiss.find((m) => m.id === aid.id);
    if (near) return { kind: 'nearMiss' as const, ...near };
    return null;
  }, [match, aid]);

  if (!aid) {
    return (
      <div className="flex-1 flex flex-col px-5 py-6">
        <BackBar />
        <div className="mt-10 text-center text-sm text-aida-muted">
          Bantuan tidak dijumpai.
        </div>
      </div>
    );
  }

  const lang = profile?.language ?? 'ms';
  const amount = formatAmountRange(aid);
  const status: MatchStatus | undefined =
    matchInfo?.kind === 'matched'
      ? matchInfo.status ?? (aid.is_auto_credited ? 'auto' : 'eligible')
      : matchInfo?.kind === 'nearMiss'
      ? 'partial'
      : aid.is_auto_credited
      ? 'auto'
      : undefined;
  const meta = status ? STATUS_META[status] : null;
  const applyUrl = aid.application.online_url;
  const fixUrl =
    matchInfo?.kind === 'nearMiss'
      ? matchInfo.fix_url
      : matchInfo?.kind === 'matched'
      ? matchInfo.fix_url
      : undefined;

  return (
    <div className="flex-1 flex flex-col">
      <BackBar />

      <div className="px-5 pt-2 pb-28">
        <div className="flex items-start gap-3">
          <ProviderLogo src={getAidLogo(aid.id)} fallback={aid.provider} size="lg" />
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-xs text-aida-muted">{aid.provider}</p>
            <h1 className="text-2xl font-bold leading-tight">{localizedName(aid, lang)}</h1>
          </div>
        </div>

        {meta && (
          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${meta.className}`}
            >
              <span aria-hidden>{meta.icon}</span> {meta.label}
            </span>
          </div>
        )}

        {amount && (
          <div className="mt-4 rounded-2xl bg-gradient-to-br from-aida-blue to-aida-blueDark text-white p-4">
            <p className="text-xs text-white/80 font-medium">Jumlah bantuan</p>
            <p className="mt-1 text-2xl font-bold">{amount}</p>
            <p className="mt-1 text-xs text-white/85">{aid.amount.description}</p>
          </div>
        )}

        {matchInfo?.kind === 'matched' && matchInfo.reason && (
          <Section title="Mengapa anda layak">
            <p className="text-sm">{matchInfo.reason}</p>
          </Section>
        )}

        {matchInfo?.kind === 'nearMiss' && (
          <Section title="Apa yang kurang">
            <p className="text-sm">{matchInfo.gap}</p>
            {matchInfo.suggestion && (
              <p className="mt-2 text-sm text-aida-muted">{matchInfo.suggestion}</p>
            )}
          </Section>
        )}

        {aid.amount.tiers && aid.amount.tiers.length > 0 && (
          <Section title="Peringkat bantuan">
            <ul className="space-y-2">
              {aid.amount.tiers.map((t, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="text-aida-ink/80">{t.label}</span>
                  <span className="font-semibold text-aida-blue shrink-0">{t.amount}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Syarat kelayakan">
          <ul className="space-y-1.5 text-sm">
            {aid.eligibility_criteria.citizenship && (
              <Criterion
                label="Warganegara"
                value={
                  aid.eligibility_criteria.citizenship.toLowerCase() === 'malaysian'
                    ? 'Warganegara Malaysia'
                    : aid.eligibility_criteria.citizenship
                }
              />
            )}
            {aid.eligibility_criteria.income_band && (
              <Criterion
                label="Pendapatan"
                value={aid.eligibility_criteria.income_band}
              />
            )}
            {aid.eligibility_criteria.min_age != null && (
              <Criterion label="Umur minimum" value={`${aid.eligibility_criteria.min_age} tahun`} />
            )}
            {aid.eligibility_criteria.religion && (
              <Criterion label="Agama" value={aid.eligibility_criteria.religion} />
            )}
            {aid.eligibility_criteria.state && (
              <Criterion label="Negeri" value={aid.eligibility_criteria.state} />
            )}
            {aid.eligibility_criteria.gender && (
              <Criterion
                label="Jantina"
                value={aid.eligibility_criteria.gender === 'male' ? 'Lelaki' : 'Perempuan'}
              />
            )}
          </ul>
          {aid.eligibility_criteria.additional_rules &&
            aid.eligibility_criteria.additional_rules.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {aid.eligibility_criteria.additional_rules.map((rule, i) => (
                  <li key={i} className="flex gap-2 text-sm text-aida-ink/80">
                    <span aria-hidden className="text-aida-blue">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            )}
        </Section>

        {aid.required_documents && aid.required_documents.length > 0 && (
          <Section title="Dokumen diperlukan">
            <ul className="space-y-1.5">
              {aid.required_documents.map((d, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span aria-hidden className="text-aida-blue">📄</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {aid.application.steps && aid.application.steps.length > 0 && (
          <Section title="Cara mohon">
            <ol className="space-y-2.5">
              {aid.application.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span
                    aria-hidden
                    className="w-6 h-6 shrink-0 rounded-full bg-aida-blue text-white grid place-items-center text-xs font-bold"
                  >
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            {aid.application.offline_options && aid.application.offline_options.length > 0 && (
              <div className="mt-3 rounded-xl bg-aida-blueLight/50 border border-aida-blue/20 p-3">
                <p className="text-xs font-semibold text-aida-blueDark mb-1">
                  Pilihan luar talian
                </p>
                <ul className="space-y-0.5">
                  {aid.application.offline_options.map((o, i) => (
                    <li key={i} className="text-xs text-aida-blueDark">• {o}</li>
                  ))}
                </ul>
              </div>
            )}
          </Section>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-black/10 px-5 py-3 z-30">
        {fixUrl ? (
          <a
            href={fixUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Daftar dahulu →
          </a>
        ) : applyUrl ? (
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            {status === 'auto' ? 'Lihat butiran →' : 'Mohon Sekarang →'}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Kembali
          </button>
        )}
      </div>
    </div>
  );
}

function BackBar() {
  return (
    <div className="sticky top-0 z-20 bg-aida-bg/90 backdrop-blur px-5 py-3 flex items-center">
      <Link
        href="/dashboard"
        aria-label="Kembali"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-aida-ink"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Kembali
      </Link>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-aida-muted mb-2">
        {title}
      </h2>
      <div className="rounded-2xl bg-white border border-black/5 p-4">{children}</div>
    </section>
  );
}

function Criterion({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <span className="text-aida-muted">{label}</span>
      <span className="font-semibold text-aida-ink text-right">{value}</span>
    </li>
  );
}
