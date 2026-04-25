'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { Language, UserProfile } from '@/lib/types';
import MyKadMock from './MyKadMock';

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

type Gender = 'male' | 'female';
type ReligionChoice = 'islam' | 'non-islam';

type Phase =
  | 'language'
  | 'mykad-entry'
  | 'mykad-scanning'
  | 'mykad-confirm'
  | 'manual-name'
  | 'manual-age'
  | 'manual-gender'
  | 'manual-state'
  | 'manual-religion'
  | 'household'
  | 'children'
  | 'income';

const PROGRESS: Record<Phase, number> = {
  language: 8,
  'mykad-entry': 18,
  'mykad-scanning': 30,
  'mykad-confirm': 55,
  'manual-name': 22,
  'manual-age': 30,
  'manual-gender': 38,
  'manual-state': 46,
  'manual-religion': 54,
  household: 68,
  children: 82,
  income: 94,
};

const MOCK_MYKAD = {
  name: 'Aminah',
  age: 58,
  gender: 'female' as Gender,
  state: 'Selangor',
  religion: 'islam' as ReligionChoice,
};

export default function OnboardingForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('language');
  const [history, setHistory] = useState<Phase[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [language, setLanguage] = useState<Language>('ms');
  const [age, setAge] = useState(35);
  const [gender, setGender] = useState<Gender | null>(null);
  const [state, setState] = useState('Selangor');
  const [householdSize, setHouseholdSize] = useState(4);
  const [numChildren, setNumChildren] = useState(0);
  const [religion, setReligion] = useState<ReligionChoice | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState<number | null>(null);

  useEffect(() => {
    if (phase !== 'mykad-scanning') return;
    const t = setTimeout(() => {
      setName(MOCK_MYKAD.name);
      setAge(MOCK_MYKAD.age);
      setGender(MOCK_MYKAD.gender);
      setState(MOCK_MYKAD.state);
      setReligion(MOCK_MYKAD.religion);
      setPhase('mykad-confirm');
    }, 2000);
    return () => clearTimeout(t);
  }, [phase]);

  function go(next: Phase) {
    setHistory((h) => (phase === 'mykad-scanning' ? h : [...h, phase]));
    setPhase(next);
  }

  function back() {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setPhase(prev);
      return h.slice(0, -1);
    });
  }

  const canContinue = useMemo(() => {
    switch (phase) {
      case 'language':
        return true;
      case 'mykad-entry':
        return false;
      case 'mykad-confirm':
        return name.length > 0 && gender !== null && religion !== null;
      case 'manual-name':
        return name.trim().length > 0;
      case 'manual-age':
        return age > 0;
      case 'manual-gender':
        return gender !== null;
      case 'manual-state':
        return state.length > 0;
      case 'manual-religion':
        return religion !== null;
      case 'household':
        return householdSize > 0;
      case 'children':
        return numChildren >= 0;
      case 'income':
        return monthlyIncome !== null;
      default:
        return false;
    }
  }, [phase, name, gender, religion, age, state, householdSize, numChildren, monthlyIncome]);

  function nextPhase() {
    switch (phase) {
      case 'language':
        return go('mykad-entry');
      case 'mykad-confirm':
        return go('household');
      case 'manual-name':
        return go('manual-age');
      case 'manual-age':
        return go('manual-gender');
      case 'manual-gender':
        return go('manual-state');
      case 'manual-state':
        return go('manual-religion');
      case 'manual-religion':
        return go('household');
      case 'household':
        return go('children');
      case 'children':
        return go('income');
      case 'income':
        return submit();
    }
  }

  async function submit() {
    if (monthlyIncome === null || gender === null || religion === null) return;
    setSubmitting(true);
    const profile: UserProfile = {
      name: name.trim(),
      language,
      age,
      state,
      householdSize,
      monthlyIncome,
      citizenship: 'malaysian',
      gender,
      numChildren,
      religion: religion === 'islam' ? 'islam' : 'non-islam',
    };
    try {
      localStorage.setItem('aida.profile', JSON.stringify(profile));
      localStorage.removeItem('aida.match');
    } catch {
      // ignore
    }
    router.push('/dashboard');
  }

  const showHeader = phase !== 'mykad-scanning';
  const showFooter = phase !== 'mykad-entry' && phase !== 'mykad-scanning';

  return (
    <div className="flex-1 flex flex-col px-6 py-5 min-h-screen">
      {showHeader && (
        <div className="pt-1">
          <div
            role="progressbar"
            aria-valuenow={PROGRESS[phase]}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 bg-black/5 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-aida-blue transition-all duration-500"
              style={{ width: `${PROGRESS[phase]}%` }}
            />
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={back}
              className="mt-3 text-sm text-aida-muted font-medium"
            >
              ← Kembali
            </button>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center py-6">
        {phase === 'language' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold">Pilih bahasa anda</h1>
              <p className="mt-1 text-sm text-aida-muted">Anda boleh tukar bila-bila masa</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLanguage(l.value)}
                  aria-pressed={language === l.value}
                  className={`min-h-tap rounded-xl border-2 px-4 py-3 text-base font-semibold transition ${
                    language === l.value
                      ? 'border-aida-blue bg-aida-blueLight text-aida-blueDark'
                      : 'border-black/10 text-aida-ink'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'mykad-entry' && (
          <div className="flex flex-col items-center text-center space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Imbas MyKad anda</h1>
              <p className="mt-2 text-sm text-aida-muted">
                AIDa akan kenal pasti maklumat asas secara automatik. Selamat dan tidak disimpan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => go('mykad-scanning')}
              className="group relative w-full"
              aria-label="Tap untuk imbas MyKad"
            >
              <MyKadMock />
              <div className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-aida-blue text-white text-sm font-semibold shadow-md group-active:scale-[0.98] transition">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                  <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                  <path d="M7 12h10" />
                </svg>
                Tap untuk imbas
              </div>
            </button>

            <button
              type="button"
              onClick={() => go('manual-name')}
              className="text-sm text-aida-blue font-semibold underline underline-offset-4"
            >
              Isi sendiri tanpa MyKad
            </button>
          </div>
        )}

        {phase === 'mykad-scanning' && (
          <div className="flex flex-col items-center text-center space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Sedang mengimbas…</h1>
              <p className="mt-2 text-sm text-aida-muted">
                Mengenal pasti maklumat dari MyKad anda
              </p>
            </div>
            <MyKadMock scanning />
            <div className="flex items-center gap-2 text-sm text-aida-muted">
              <div className="w-3 h-3 rounded-full border-2 border-aida-blueLight border-t-aida-blue animate-spin" />
              <span>Memproses imej…</span>
            </div>
          </div>
        )}

        {phase === 'mykad-confirm' && (
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aida-blueLight text-aida-blueDark text-xs font-semibold">
                <span aria-hidden>✓</span> Maklumat dikenal pasti
              </div>
              <h1 className="mt-3 text-2xl font-bold">Sah maklumat ini?</h1>
              <p className="mt-1 text-sm text-aida-muted">
                Anda boleh edit jika ada yang tidak betul
              </p>
            </div>

            <div className="space-y-3">
              <ConfirmField
                label="Nama"
                value={name}
                onChange={setName}
                type="text"
              />
              <ConfirmField
                label="Umur"
                value={String(age)}
                onChange={(v) => setAge(Number(v) || 0)}
                type="number"
              />
              <ConfirmSelect
                label="Jantina"
                value={gender}
                options={[
                  { value: 'male', label: 'Lelaki' },
                  { value: 'female', label: 'Perempuan' },
                ]}
                onChange={(v) => setGender(v as Gender)}
              />
              <ConfirmSelectDropdown
                label="Negeri"
                value={state}
                options={STATES}
                onChange={setState}
              />
              <ConfirmSelect
                label="Agama"
                value={religion}
                options={[
                  { value: 'islam', label: 'Islam' },
                  { value: 'non-islam', label: 'Bukan Islam' },
                ]}
                onChange={(v) => setReligion(v as ReligionChoice)}
              />
            </div>
          </div>
        )}

        {phase === 'manual-name' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold">Apa nama panggilan anda?</h1>
              <p className="mt-1 text-sm text-aida-muted">Hanya nama panggilan, bukan nama penuh</p>
            </div>
            <input
              id="name"
              type="text"
              autoComplete="given-name"
              autoFocus
              className="field"
              placeholder="cth. Aminah"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        {phase === 'manual-age' && (
          <div className="space-y-5">
            <h1 className="text-2xl font-bold">Berapa umur anda?</h1>
            <NumberStepper value={age} min={18} max={90} step={1} onChange={setAge} />
          </div>
        )}

        {phase === 'manual-gender' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Jantina anda?</h1>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'male' as Gender, label: 'Lelaki' },
                { value: 'female' as Gender, label: 'Perempuan' },
              ].map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(g.value)}
                  aria-pressed={gender === g.value}
                  className={`min-h-tap rounded-xl border-2 px-4 py-3 text-base font-semibold transition ${
                    gender === g.value
                      ? 'border-aida-blue bg-aida-blueLight text-aida-blueDark'
                      : 'border-black/10 text-aida-ink'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'manual-state' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Negeri anda?</h1>
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
        )}

        {phase === 'manual-religion' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold">Agama anda?</h1>
              <p className="mt-1 text-sm text-aida-muted">Untuk semak kelayakan bantuan zakat</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'islam' as ReligionChoice, label: 'Islam' },
                { value: 'non-islam' as ReligionChoice, label: 'Bukan Islam' },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReligion(r.value)}
                  aria-pressed={religion === r.value}
                  className={`min-h-tap rounded-xl border-2 px-4 py-3 text-base font-semibold transition ${
                    religion === r.value
                      ? 'border-aida-blue bg-aida-blueLight text-aida-blueDark'
                      : 'border-black/10 text-aida-ink'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'household' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold">Bilangan ahli isi rumah?</h1>
              <p className="mt-1 text-sm text-aida-muted">
                Termasuk anak, ibu bapa atau yang anda tanggung
              </p>
            </div>
            <NumberStepper
              value={householdSize}
              min={1}
              max={15}
              step={1}
              onChange={setHouseholdSize}
            />
          </div>
        )}

        {phase === 'children' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold">Bilangan anak di bawah 18?</h1>
              <p className="mt-1 text-sm text-aida-muted">Tetapkan 0 jika tiada</p>
            </div>
            <NumberStepper
              value={numChildren}
              min={0}
              max={10}
              step={1}
              onChange={setNumChildren}
            />
          </div>
        )}

        {phase === 'income' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold">Pendapatan bulanan isi rumah?</h1>
              <p className="mt-1 text-sm text-aida-muted">
                Anggaran sahaja. Tiada bukti diperlukan sekarang.
              </p>
            </div>
            <div className="space-y-2.5">
              {INCOME_BUCKETS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setMonthlyIncome(b.value)}
                  aria-pressed={monthlyIncome === b.value}
                  className={`w-full min-h-tap rounded-xl border-2 px-4 py-3 text-left text-base font-semibold transition ${
                    monthlyIncome === b.value
                      ? 'border-aida-blue bg-aida-blueLight text-aida-blueDark'
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

      {showFooter && (
        <div className="pb-4">
          <button
            type="button"
            className="btn-primary"
            onClick={nextPhase}
            disabled={!canContinue || submitting}
          >
            {submitting
              ? 'Memuatkan…'
              : phase === 'income'
              ? 'Cari Bantuan Saya'
              : phase === 'mykad-confirm'
              ? 'Sah & Teruskan'
              : 'Seterusnya'}
          </button>
        </div>
      )}
    </div>
  );
}

function NumberStepper({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={dec}
        aria-label="Kurangkan"
        className="w-12 h-12 rounded-xl border-2 border-aida-blue text-aida-blue text-xl font-bold disabled:opacity-40"
        disabled={value <= min}
      >
        −
      </button>
      <div
        aria-live="polite"
        className="flex-1 text-center text-2xl font-bold tabular-nums py-2.5 rounded-xl bg-aida-blueLight"
      >
        {value}
      </div>
      <button
        type="button"
        onClick={inc}
        aria-label="Tambah"
        className="w-12 h-12 rounded-xl border-2 border-aida-blue text-aida-blue text-xl font-bold disabled:opacity-40"
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}

function ConfirmField({
  label,
  value,
  onChange,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white px-4 py-2.5">
      <div className="text-xs text-aida-muted font-medium">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-base font-semibold focus:outline-none"
      />
    </div>
  );
}

function ConfirmSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white px-4 py-2.5">
      <div className="text-xs text-aida-muted font-medium">{label}</div>
      <div className="mt-1 flex gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition ${
              value === o.value
                ? 'bg-aida-blue text-white'
                : 'bg-black/5 text-aida-ink'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConfirmSelectDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white px-4 py-2.5">
      <div className="text-xs text-aida-muted font-medium">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-base font-semibold focus:outline-none"
      >
        {options.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
