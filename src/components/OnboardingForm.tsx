'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Language, UserProfile } from '@/lib/types';

const STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Perak',
  'Perlis',
  'Pulau Pinang',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
  'Kuala Lumpur',
  'Labuan',
  'Putrajaya',
];

const LANGUAGES: Array<{ value: Language; label: string }> = [
  { value: 'ms', label: 'Bahasa Malaysia' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ta', label: 'தமிழ்' },
];

const INCOME_BUCKETS = [
  { value: 800, label: 'Kurang RM1,000' },
  { value: 1500, label: 'RM1,000 – RM2,000' },
  { value: 2500, label: 'RM2,000 – RM3,000' },
  { value: 3500, label: 'RM3,000 – RM4,000' },
  { value: 5000, label: 'Lebih RM4,000' },
];

const TOTAL_STEPS = 3;

export default function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<Language>('ms');
  const [age, setAge] = useState(35);
  const [state, setState] = useState('Kelantan');
  const [householdSize, setHouseholdSize] = useState(4);
  const [monthlyIncome, setMonthlyIncome] = useState<number | null>(null);

  const canContinue = useMemo(() => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return age > 0 && state.length > 0 && householdSize > 0;
    if (step === 3) return monthlyIncome !== null;
    return false;
  }, [step, name, age, state, householdSize, monthlyIncome]);

  function next() {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    submit();
  }

  function back() {
    if (step > 1) setStep(step - 1);
  }

  async function submit() {
    if (monthlyIncome === null) return;
    setSubmitting(true);
    const profile: UserProfile = {
      name: name.trim(),
      language,
      age,
      state,
      householdSize,
      monthlyIncome,
      citizenship: 'malaysian',
    };
    try {
      localStorage.setItem('aida.profile', JSON.stringify(profile));
    } catch {
      // localStorage may be unavailable in private mode — non-fatal for demo
    }
    router.push('/dashboard');
  }

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="flex-1 flex flex-col px-6 py-6">
      <div className="pt-2">
        <div
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          className="h-2 bg-black/5 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-aida-green transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-aida-muted">
          Langkah {step} dari {TOTAL_STEPS}
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center py-8">
        {step === 1 && (
          <div className="space-y-6">
            <h1>Helo! Apa nama anda?</h1>
            <div>
              <label htmlFor="name" className="label">
                Nama panggilan
              </label>
              <input
                id="name"
                type="text"
                inputMode="text"
                autoComplete="given-name"
                className="field"
                placeholder="cth. Ahmad"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <p className="label">Pilih bahasa</p>
              <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLanguage(l.value)}
                    aria-pressed={language === l.value}
                    className={`min-h-tap rounded-xl border-2 px-4 py-3 text-body font-semibold transition ${
                      language === l.value
                        ? 'border-aida-green bg-aida-greenLight text-aida-greenDark'
                        : 'border-black/10 text-aida-ink'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h1>Sedikit tentang anda</h1>

            <NumberStepper
              label="Umur anda"
              value={age}
              min={18}
              max={90}
              step={1}
              onChange={setAge}
            />

            <NumberStepper
              label="Bilangan ahli isi rumah"
              value={householdSize}
              min={1}
              max={15}
              step={1}
              onChange={setHouseholdSize}
              hint="Termasuk anak, ibu bapa atau yang anda tanggung"
            />

            <div>
              <label htmlFor="state" className="label">
                Negeri
              </label>
              <select
                id="state"
                className="field"
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h1>Pendapatan bulanan isi rumah</h1>
            <p className="text-aida-muted">Anggaran sahaja. Tiada bukti diperlukan sekarang.</p>
            <div className="space-y-3">
              {INCOME_BUCKETS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setMonthlyIncome(b.value)}
                  aria-pressed={monthlyIncome === b.value}
                  className={`w-full min-h-tap rounded-2xl border-2 px-5 py-4 text-left text-lead font-semibold transition ${
                    monthlyIncome === b.value
                      ? 'border-aida-green bg-aida-greenLight text-aida-greenDark'
                      : 'border-black/10 text-aida-ink'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pb-6 space-y-3">
        <button
          type="button"
          className="btn-primary"
          onClick={next}
          disabled={!canContinue || submitting}
        >
          {submitting ? 'Memuatkan…' : step === TOTAL_STEPS ? 'Cari Bantuan Saya' : 'Seterusnya'}
        </button>
        {step > 1 && (
          <button
            type="button"
            className="w-full min-h-tap text-aida-muted text-body font-medium"
            onClick={back}
          >
            ← Kembali
          </button>
        )}
      </div>
    </div>
  );
}

function NumberStepper({
  label,
  value,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={dec}
          aria-label={`Kurangkan ${label}`}
          className="w-14 h-14 rounded-2xl border-2 border-aida-green text-aida-green text-2xl font-bold"
          disabled={value <= min}
        >
          −
        </button>
        <div
          aria-live="polite"
          className="flex-1 text-center text-3xl font-bold tabular-nums py-3 rounded-2xl bg-aida-greenLight"
        >
          {value}
        </div>
        <button
          type="button"
          onClick={inc}
          aria-label={`Tambah ${label}`}
          className="w-14 h-14 rounded-2xl border-2 border-aida-green text-aida-green text-2xl font-bold"
          disabled={value >= max}
        >
          +
        </button>
      </div>
      {hint && <p className="mt-2 text-sm text-aida-muted">{hint}</p>}
    </div>
  );
}
