import type { Aid } from '@/lib/types';

const FREQ_LABEL: Record<string, string> = {
  yearly: '/tahun',
  monthly: '/bulan',
  quarterly: '/3 bulan',
  'one-off': 'sekali',
};

export default function AidCard({
  aid,
  reason,
  confidence,
}: {
  aid: Aid;
  reason: string;
  confidence?: number;
}) {
  const amount = `RM${aid.amount.toLocaleString('en-MY')}`;
  return (
    <article className="card space-y-3">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold leading-tight">{aid.name}</h2>
        <p className="text-sm text-aida-muted">{aid.provider}</p>
      </header>

      <div className="flex items-baseline gap-2">
        <span className="text-amount font-bold text-aida-green">{amount}</span>
        <span className="text-body text-aida-muted">{FREQ_LABEL[aid.frequency] ?? ''}</span>
        {typeof confidence === 'number' && (
          <span className="ml-auto chip text-sm">
            {Math.round(confidence * 100)}% padanan
          </span>
        )}
      </div>

      <p className="text-body">{aid.description}</p>

      <div className="rounded-xl bg-aida-greenLight border border-aida-green/20 p-3">
        <p className="text-sm font-semibold text-aida-greenDark mb-1">Mengapa anda layak?</p>
        <p className="text-body text-aida-ink">{reason}</p>
      </div>

      <a
        href={aid.applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary"
      >
        Mohon Sekarang →
      </a>
    </article>
  );
}

export function NearMissCard({
  aid,
  gap,
  suggestion,
}: {
  aid: Aid;
  gap: string;
  suggestion: string;
}) {
  return (
    <article className="card space-y-2 border-dashed">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">{aid.name}</h2>
        <span className="text-aida-green font-bold">RM{aid.amount.toLocaleString('en-MY')}</span>
      </header>
      <p className="text-sm text-aida-muted">{aid.provider}</p>
      <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3">
        <p className="text-sm font-semibold text-yellow-900">Apa yang kurang?</p>
        <p className="text-body">{gap}</p>
        <p className="mt-2 text-sm text-aida-muted">{suggestion}</p>
      </div>
    </article>
  );
}
