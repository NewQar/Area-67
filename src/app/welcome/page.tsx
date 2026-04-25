import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div className="flex-1 flex flex-col px-6 py-8">
      <header className="pt-6">
        <div className="inline-flex items-center gap-3">
          <div
            aria-hidden
            className="w-11 h-11 rounded-2xl bg-aida-green text-white grid place-items-center text-xl font-bold"
          >
            A
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-aida-muted">AIDa</p>
            <p className="text-sm font-semibold">Aid Intelligent & Discovery Assistant</p>
          </div>
        </div>
      </header>

      <section className="flex-1 flex flex-col justify-center py-10">
        <h1 className="text-3xl font-bold leading-tight">
          Cari bantuan yang <span className="text-aida-green">anda layak</span> terima.
        </h1>
        <p className="mt-3 text-base text-aida-muted">
          Jawab beberapa soalan ringkas. AIDa akan tunjukkan bantuan kerajaan dan zakat untuk anda — dalam 30 saat.
        </p>

        <ul className="mt-7 space-y-2.5 text-sm">
          <li className="flex items-start gap-2.5">
            <span aria-hidden className="mt-0.5 text-aida-green">✓</span>
            Percuma dan tanpa daftar
          </li>
          <li className="flex items-start gap-2.5">
            <span aria-hidden className="mt-0.5 text-aida-green">✓</span>
            Tersedia dalam Bahasa Malaysia
          </li>
          <li className="flex items-start gap-2.5">
            <span aria-hidden className="mt-0.5 text-aida-green">✓</span>
            Sembang dengan AIDa untuk panduan
          </li>
        </ul>
      </section>

      <footer className="pb-4 space-y-3">
        <Link href="/onboarding" className="btn-primary" aria-label="Mula sekarang">
          Mula Sekarang
        </Link>
        <p className="text-center text-xs text-aida-muted">
          Dengan meneruskan, anda bersetuju kongsi maklumat untuk padanan bantuan sahaja.
        </p>
      </footer>
    </div>
  );
}
