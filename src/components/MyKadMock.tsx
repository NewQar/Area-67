export default function MyKadMock({ scanning = false }: { scanning?: boolean }) {
  return (
    <div className="relative w-full max-w-[320px] aspect-[1.586/1] mx-auto select-none">
      <div className="absolute inset-0 rounded-2xl shadow-xl overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, #1e3a5f 0%, #2c5282 50%, #1e3a5f 100%)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{
            background:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0 2px, transparent 2px 8px)',
          }}
        />

        <div className="absolute top-2 left-3 right-3 flex items-center justify-between text-[8px] text-white/90 font-semibold tracking-wider">
          <span>MALAYSIA</span>
          <span className="text-amber-300">★ JATA NEGARA</span>
        </div>

        <div className="absolute top-7 left-3 text-[10px] text-amber-300 font-bold tracking-widest">
          MyKad
        </div>
        <div className="absolute top-[42px] left-3 text-[7px] text-white/80 tracking-wider">
          KAD PENGENALAN MALAYSIA
        </div>

        <div className="absolute top-[58px] left-3 w-[60px] h-[78px] rounded-sm bg-gradient-to-b from-slate-300 to-slate-400 grid place-items-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
          </svg>
        </div>

        <div className="absolute top-[58px] left-[78px] right-3 text-white">
          <div className="text-[6px] text-white/60 uppercase tracking-wider">No. Pengenalan</div>
          <div className="text-[11px] font-semibold tracking-wider">680515-10-5246</div>
          <div className="mt-1.5 text-[6px] text-white/60 uppercase tracking-wider">Nama</div>
          <div className="text-[9px] font-semibold leading-tight">AMINAH BINTI ABDULLAH</div>
          <div className="mt-1 text-[6px] text-white/60 uppercase tracking-wider">Warganegara</div>
          <div className="text-[8px] font-semibold">WARGANEGARA</div>
        </div>

        <div className="absolute bottom-2 right-3 w-9 h-7 rounded-sm bg-gradient-to-br from-amber-300 to-amber-500 grid place-items-center">
          <div className="grid grid-cols-3 gap-[1px] w-[26px] h-[18px]">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-amber-700/40 rounded-[1px]" />
            ))}
          </div>
        </div>
      </div>

      {scanning && (
        <>
          <div className="absolute inset-0 rounded-2xl ring-4 ring-aida-green/60 animate-pulse" />
          <div
            className="absolute left-0 right-0 h-[3px] bg-aida-green shadow-[0_0_12px_2px_rgba(10,124,74,0.8)]"
            style={{
              top: '0%',
              animation: 'mykad-scan 1.6s ease-in-out infinite',
            }}
          />
          <style jsx>{`
            @keyframes mykad-scan {
              0%, 100% { top: 0%; }
              50% { top: calc(100% - 3px); }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
