'use client';

import Image from 'next/image';
import Link from 'next/link';
import logo from '../../public/sm-logo.png';

interface MobileTopAppBarProps {
  backHref?: string;
}

export default function MobileTopAppBar({ backHref }: MobileTopAppBarProps) {
  return (
    <header className="bg-[var(--color-primary)] text-[var(--color-on-primary)] fixed top-0 w-full z-50 h-16 flex items-center justify-between px-4 shadow-md">
      {/* Back arrow or Hamburger */}
      {backHref ? (
        <Link
          href={backHref}
          aria-label="Go back"
          className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </Link>
      ) : (
        <button
          aria-label="Menu"
          className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-white">menu</span>
        </button>
      )}

      {/* SM Logo (centered) */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <Image
          src={logo}
          alt="SM Markets"
          height={32}
          className="h-8 w-auto object-contain"
        />
      </div>

      {/* Search */}
      <button
        aria-label="Search"
        className="flex items-center justify-center p-2 -mr-2 rounded-full hover:bg-white/10 active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-white">search</span>
      </button>
    </header>
  );
}
