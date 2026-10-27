/**
 * Two sizes of every profile photo: a small thumbnail for avatars and lists, and the HD photo,
 * loaded only when someone opens it full screen. Works for both kinds of photo URL we store.
 */

/** Our uploads: `/api/profile-pictures/<name>`; the thumbnail lives at `/api/profile-pictures/thumb/<name>`. */
const OUR_PHOTO = /\/api\/profile-pictures\/(?!thumb\/)([^/?#]+)$/;
/** Google account photos end in a size, e.g. `=s96-c`. */
const GOOGLE_SIZE = /=s\d+(-c)?$/;

/** For avatars, lists and cards. */
export function photoThumb(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (OUR_PHOTO.test(url)) return url.replace(OUR_PHOTO, "/api/profile-pictures/thumb/$1");
  if (GOOGLE_SIZE.test(url)) return url.replace(GOOGLE_SIZE, "=s360-c");
  return url;
}

/** For the full-screen viewer. */
export function photoFull(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (GOOGLE_SIZE.test(url)) return url.replace(GOOGLE_SIZE, "=s1200-c");
  return url;
}
