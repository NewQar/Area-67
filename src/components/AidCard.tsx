import type { Aid, Language, MatchStatus } from '@/lib/types';

function formatAmountRange(aid: Aid): string {
  const { min_myr, max_myr } = aid.amount;
  if (min_myr === 0 && (max_myr === 0 || max_myr == null)) return '';
  if (max_myr == null || max_myr === min_myr) return `RM${min_myr.toLocaleString('en-MY')}`;
  return `RM${min_myr.toLocaleString('en-MY')}–RM${max_myr.toLocaleString('en-MY')}`;
}

function localizedName(aid: Aid, language: Language): string {
  return aid.name[language] || aid.name.ms;
}

const STATUS_LABEL: Record<MatchStatus, string> = {
  eligible: 'Anda layak',
  partial: 'Hampir layak',
  auto: 'Auto — tiada permohonan',
};

export default function AidCard({
  aid,
  reason,
  confidence,
  language = 'ms',
  status,
  gap,
  fixUrl,
  estimatedDays,
}: {
  aid: Aid;
  reason: string;
  confidence?: number;
  language?: Language;
  status?: MatchStatus;
  gap?: string;
  fixUrl?: string;
  estimatedDays?: number;
}) {
  const amount = formatAmountRange(aid);
  const isAuto = status === 'auto' || (status !== 'partial' && aid.is_auto_credited === true);
  const isPartial = status === 'partial';
  const applyUrl = aid.application.online_url;
  const isMs = language === 'ms';

  return (
    <article className={`card space-y-3 ${isPartial ? 'border-yellow-300' : ''}`}>
      <header className="space-y-1">
        <h2 className="text-2xl font-bold leading-tight">{localizedName(aid, language)}</h2>
        <p className="text-sm text-aida-muted">{aid.provider}</p>
      </header>

      <div className="flex items-baseline flex-wrap gap-2">
        {amount && <span className="text-amount font-bold text-aida-green">{amount}</span>}
        {isAuto && (
          <span className="chip text-sm bg-aida-greenLight text-aida-greenDark border border-aida-green/30">
            ⚡ {STATUS_LABEL.auto}
          </span>
        )}
        {isPartial && (
          <span className="chip text-sm bg-yellow-50 text-yellow-900 border border-yellow-300">
            ⚠ {STATUS_LABEL.partial}
          </span>
        )}
        {typeof confidence === 'number' && !isPartial && (
          <span className="ml-auto chip text-sm">
            {Math.round(confidence * 100)}% padanan
          </span>
        )}
      </div>

      <p className="text-body">{aid.amount.description}</p>

      {isPartial && gap ? (
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3">
          <p className="text-sm font-semibold text-yellow-900 mb-1">
            {isMs ? 'Apa yang kurang?' : "What's missing?"}
          </p>
          <p className="text-body">{gap}</p>
          {typeof estimatedDays === 'number' && (
            <p className="mt-1 text-sm text-aida-muted">
              {isMs ? `Anggaran ${estimatedDays} hari` : `~${estimatedDays} days`}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-aida-greenLight border border-aida-green/20 p-3">
          <p className="text-sm font-semibold text-aida-greenDark mb-1">
            {isMs ? 'Mengapa anda layak?' : 'Why you qualify'}
          </p>
          <p className="text-body text-aida-ink">{reason}</p>
        </div>
      )}

      {isPartial && fixUrl ? (
        <a href={fixUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
          {isMs ? 'Daftar dahulu →' : 'Register first →'}
        </a>
      ) : applyUrl ? (
        <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
          {isAuto ? (isMs ? 'Lihat butiran →' : 'View details →') : isMs ? 'Mohon Sekarang →' : 'Apply Now →'}
        </a>
      ) : null}
    </article>
  );
}

export function NearMissCard({
  aid,
  gap,
  suggestion,
  fixUrl,
  language = 'ms',
}: {
  aid: Aid;
  gap: string;
  suggestion: string;
  fixUrl?: string;
  language?: Language;
}) {
  const amount = formatAmountRange(aid);
  return (
    <article className="card space-y-2 border-dashed">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">{localizedName(aid, language)}</h2>
        {amount && <span className="text-aida-green font-bold">{amount}</span>}
      </header>
      <p className="text-sm text-aida-muted">{aid.provider}</p>
      <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3">
        <p className="text-sm font-semibold text-yellow-900">Apa yang kurang?</p>
        <p className="text-body">{gap}</p>
        <p className="mt-2 text-sm text-aida-muted">{suggestion}</p>
      </div>
      {fixUrl && (
        <a
          href={fixUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          Daftar sekarang →
        </a>
      )}
    </article>
  );
}
