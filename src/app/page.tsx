'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      let hasProfile = false;
      try {
        hasProfile = !!localStorage.getItem('aida.profile');
      } catch {
        hasProfile = false;
      }
      router.replace(hasProfile ? '/dashboard' : '/welcome');
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 bg-aida-green text-white">
      <div className="flex flex-col items-center gap-5">
        <div
          aria-hidden
          className="w-24 h-24 rounded-3xl bg-white text-aida-green grid place-items-center text-5xl font-bold shadow-lg"
        >
          A
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">AIDa</h1>
          <p className="mt-1 text-sm text-white/80">Aid Intelligent & Discovery Assistant</p>
        </div>
      </div>
      <div className="mt-12">
        <div
          aria-label="Memuatkan"
          className="w-8 h-8 rounded-full border-[3px] border-white/30 border-t-white animate-spin"
        />
      </div>
    </div>
  );
}
