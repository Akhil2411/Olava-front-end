import Image from "next/image";
import Link from "next/link";

export function Logo({ href = "/", height = 40 }: { href?: string; height?: number }) {
  return (
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label="Olava Invites home">
      
      <Image src="/logo.png" alt="Olava Invites" width={Math.round(height * 2.857)} height={height} priority />
    </Link>
  );
}
