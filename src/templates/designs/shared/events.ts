/** Page-level signal that the guest opened the invitation (doors, envelope…). Music starts on it. */
const OPENED = "olava:invite-opened";

export function announceInviteOpened() {
  window.dispatchEvent(new Event(OPENED));
}

export function onInviteOpened(handler: () => void): () => void {
  window.addEventListener(OPENED, handler);
  return () => window.removeEventListener(OPENED, handler);
}

/**
 * The home page's device showcase shows templates opened (no opening animation), via ?showcase=1 on the
 * sample page. Only the sample page is ever framed that way.
 */
export function isShowcase(): boolean {
  try { return new URLSearchParams(location.search).has("showcase"); } catch { return false; }
}

/**
 * Guests who already opened this invitation in this tab skip the opening (add #intro to see it again).
 * `key` is null outside the live site: the host's preview and the gallery samples show the opening every time.
 */
export function seenIntro(key: string | null): boolean {
  if (isShowcase()) return true;
  if (!key) return false;
  try { return location.hash !== "#intro" && sessionStorage.getItem(`olava-opened:${key}`) === "1"; } catch { return false; }
}

export function rememberIntro(key: string | null) {
  if (!key) return;
  try { sessionStorage.setItem(`olava-opened:${key}`, "1"); } catch { /* private mode */ }
}

/** One sound at a time: whoever starts playing claims the page, and every other player pauses. */
const CLAIM = "olava:music-claim";

export function claimMusic(owner: object) {
  window.dispatchEvent(new CustomEvent(CLAIM, { detail: owner }));
}

/** `handler` gets the player that started; ignore your own. */
export function onMusicClaimed(handler: (by: object) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent).detail);
  window.addEventListener(CLAIM, listener);
  return () => window.removeEventListener(CLAIM, listener);
}

/** The sound that claimed the page has stopped (a video paused or ended): whoever it paused may carry on. */
const RELEASE = "olava:music-release";

export function releaseMusic(owner: object) {
  window.dispatchEvent(new CustomEvent(RELEASE, { detail: owner }));
}

export function onMusicReleased(handler: (by: object) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent).detail);
  window.addEventListener(RELEASE, listener);
  return () => window.removeEventListener(RELEASE, listener);
}
