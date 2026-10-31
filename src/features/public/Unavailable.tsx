import Link from "next/link";

/** Neutral page for missing, unpublished or ended sites. Never redirects anywhere else (no cross-customer leaks). */
export function Unavailable({ ended }: { ended?: boolean }) {
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-blush px-5 text-center">
      <div className="max-w-md">
        <p className="text-3xl text-pink-dark" aria-hidden="true">✦</p>
        <h1 className="mt-3 text-5xl">{ended ? "This celebration has ended" : "This wedding website isn't available"}</h1>
        <p className="mt-3 text-mute">
          {ended ? "Thank you for visiting. This wedding website is no longer online." : "The link may be incorrect, or the couple may have taken their website offline."}
        </p>
        <Link href="/" className="mt-8 inline-block text-sm text-mute underline-offset-4 hover:underline">Made with Olava Invites</Link>
      </div>
    </main>
  );
}
