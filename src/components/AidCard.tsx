import Link from 'next/link';
import { getAidLogo } from '@/lib/logo';
import type { Aid, Language, MatchStatus } from '@/lib/types';

function formatAmountRange(aid: Aid): string {
  const { min_myr, max_myr } = aid.amount;
  if (min_myr === 0 && (max_myr === 0 || max_myr == null)) return '';
  if (max_myr == null || max_myr === min_myr) return `RM${min_myr.toLocaleString('en-MY')}`;
  return `RM${min_myr.toLocaleString('en-MY')}–${max_myr.toLocaleString('en-MY')}`;
}

function localizedName(aid: Aid, language: Language): string {
  return aid.name[language] || aid.name.ms;
}

const STATUS_META: Record<
  MatchStatus,
  { label: string; textClass: string; cardClass: string; icon: string }
> = {
  eligible: {
    label: 'Layak',
    textClass: 'text-aida-blueDark',
    cardClass: 'bg-aida-blueLight border-aida-blue/20',
    icon: '✓',
  },
  partial: {
    label: 'Hampir Layak',
    textClass: 'text-orange-700',
    cardClass: 'bg-orange-50 border-orange-200',
    icon: '⚠',
  },
  auto: {
    label: 'Auto',
    textClass: 'text-aida-blueDark',
    cardClass: 'bg-aida-blueLight border-aida-blue/20',
    icon: '⚡',
  },
};

export default function AidCard({
  aid,
  language = 'ms',
  status,
}: {
  aid: Aid;
  language?: Language;
  status?: MatchStatus;
}) {
  const amount = formatAmountRange(aid);
  const effectiveStatus: MatchStatus | undefined =
    status ?? (aid.is_auto_credited ? 'auto' : undefined);
  const meta = effectiveStatus ? STATUS_META[effectiveStatus] : null;
  const logo = getAidLogo(aid.id);

  return (
    <Link
      href={`/aids/${aid.id}`}
      className={`flex flex-col rounded-2xl border shadow-sm p-3 active:scale-[0.98] transition ${
        meta?.cardClass ?? 'bg-white border-black/5'
      }`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <ProviderLogo src={logo} fallback={aid.provider} />
        {meta && (
          <span
            className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold ${meta.textClass}`}
          >
            <span aria-hidden>{meta.icon}</span>
            {meta.label}
          </span>
        )}
      </div>

      <h3 className="mt-2.5 text-sm font-semibold leading-tight line-clamp-2 min-h-[2.25rem]">
        {localizedName(aid, language)}
      </h3>

      <div className="mt-auto pt-2.5 border-t border-black/5">
        {amount ? (
          <>
            <p className="text-[10px] text-aida-muted leading-none uppercase tracking-wider">
              Nilai
            </p>
            <p className="mt-1 text-sm font-bold text-aida-blue truncate">{amount}</p>
          </>
        ) : (
          <p className="text-xs text-aida-muted">Pendaftaran</p>
        )}
      </div>
    </Link>
  );
}

export function ProviderLogo({
  src,
  fallback,
  size = 'md',
}: {
  src: string | null;
  fallback: string;
  size?: 'md' | 'lg';
}) {
  const dim = size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  if (src) {
    return (
      <div
        className={`shrink-0 ${dim} rounded-xl bg-white border border-black/5 grid place-items-center overflow-hidden`}
      >
        <img
          src={src}
          alt=""
          className="w-full h-full object-contain p-1"
          loading="lazy"
        />
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className={`shrink-0 ${dim} rounded-xl bg-aida-blueLight text-aida-blueDark grid place-items-center font-bold`}
    >
      {fallback.charAt(0).toUpperCase()}
    </div>
  );
}
