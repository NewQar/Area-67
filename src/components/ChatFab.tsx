import Link from 'next/link';

export default function ChatFab() {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none z-30">
      <Link
        href="/chat"
        aria-label="Sembang dengan AIDa"
        className="pointer-events-auto absolute bottom-[76px] right-5 w-14 h-14 rounded-full bg-aida-blue text-white grid place-items-center shadow-lg active:scale-95 transition"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z" />
          <circle cx="9" cy="12" r="0.8" fill="currentColor" />
          <circle cx="12" cy="12" r="0.8" fill="currentColor" />
          <circle cx="15" cy="12" r="0.8" fill="currentColor" />
        </svg>
      </Link>
    </div>
  );
}
