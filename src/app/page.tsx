import Link from 'next/link';

export default function Landing() {
  return (
    <div className="flex-1 flex flex-col px-6 py-10">
      <header className="pt-8">
        <div className="inline-flex items-center gap-3">
          <div
            aria-hidden
            className="w-12 h-12 rounded-2xl bg-aida-green text-white grid place-items-center text-2xl font-bold"
          >
            A
          </div>
          <div>
            <p className="text-sm uppercase tracking-wider text-aida-muted">AIDa</p>
            <p className="text-body font-semibold">Pembantu Bantuan Anda</p>
          </div>
        </div>
      </header>

      <section className="flex-1 flex flex-col justify-center py-12">
        <h1 className="text-4xl font-bold leading-tight">
          Cari bantuan yang <span className="text-aida-green">anda layak</span> terima.
        </h1>
        <p className="mt-4 text-lead text-aida-muted">
          Jawab 5 soalan ringkas. AIDa akan tunjukkan bantuan kerajaan dan zakat untuk anda — dalam
          30 saat.
        </p>

        <ul className="mt-8 space-y-3 text-body">
          <li className="flex items-start gap-3">
            <span aria-hidden className="mt-1 text-aida-green text-xl">✓</span>
            Percuma dan tanpa daftar
          </li>
          <li className="flex items-start gap-3">
            <span aria-hidden className="mt-1 text-aida-green text-xl">✓</span>
            Tersedia dalam Bahasa Malaysia
          </li>
          <li className="flex items-start gap-3">
            <span aria-hidden className="mt-1 text-aida-green text-xl">✓</span>
            Sembang dengan AIDa untuk panduan
          </li>
        </ul>
      </section>

      <footer className="pb-6 space-y-3">
        <Link href="/onboarding" className="btn-primary" aria-label="Mula sekarang">
          Mula Sekarang
        </Link>
        <p className="text-center text-sm text-aida-muted">
          Dengan meneruskan, anda bersetuju kongsi maklumat untuk padanan bantuan sahaja.
        </p>
      </footer>
    </div>
  );
}
