import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-blush px-5 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="text-5xl">We couldn&apos;t find that page</h1>
        <p className="mt-3 text-mute">It may have moved, or you may not have access to it.</p>
        <Link href="/" className="mt-6 inline-block font-semibold text-pink-dark underline">Go to the home page</Link>
      </div>
    </main>
  );
}
