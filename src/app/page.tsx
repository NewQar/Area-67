'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function SplashPage() {
  const router = useRouter();
  const [enter, setEnter] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEnter(true));
    const timer = setTimeout(() => {
      let hasProfile = false;
      try {
        hasProfile = !!localStorage.getItem('aida.profile');
      } catch {
        hasProfile = false;
      }
      router.replace(hasProfile ? '/dashboard' : '/welcome');
    }, 1500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 bg-white text-aida-ink">
      <div className="flex flex-col items-center gap-5">
        <div
          className={`transition-all duration-700 ease-out ${
            enter ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
        >
          <Image
            src="/logo/aida.png"
            alt="AIDa"
            width={120}
            height={120}
            priority
            className="w-28 h-28 object-contain drop-shadow-lg"
          />
        </div>
        <div
          className={`text-center transition-all duration-700 ease-out delay-200 ${
            enter ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <p className="text-sm text-aida-muted">Aid Intelligent & Discovery Assistant</p>
        </div>
      </div>
      <div className="mt-12">
        <div
          aria-label="Memuatkan"
          className="w-8 h-8 rounded-full border-[3px] border-aida-green/20 border-t-aida-green animate-spin"
        />
      </div>
    </div>
  );
}
