import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center bg-gradient-to-br from-[#fde3ee] to-[#f7cfe0] px-5 py-8 text-center">
        <Logo height={44} />
        <p className="mt-4 hidden max-w-sm font-serif text-[26px] italic lg:block">Every great love story deserves a beautiful invitation.</p>
        <span className="mt-4 text-2xl text-pink-dark" aria-hidden="true">✦ ♥ ✦</span>
      </div>
      <div className="flex items-start justify-center bg-white px-5 pb-12 pt-8 lg:items-center">
        <div className="w-full max-w-[400px]">
          <Link href="/" className="text-sm text-mute hover:text-ink">← Back to home</Link>
          {children}
        </div>
      </div>
    </main>
  );
}
