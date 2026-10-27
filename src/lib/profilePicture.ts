import { API_CONFIG, authenticatedFetch } from "@/lib/api";

/** Longest side of the uploaded photo; the profile shows it at 56px, search at a little more. */
const MAX_SIDE = 512;
const JPEG_QUALITY = 0.85;

/** Center-crops to a square and scales down, so a 5 MB camera photo uploads as ~60 KB. */
async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("That file isn't an image we can read");
  });
  const side = Math.min(bitmap.width, bitmap.height);
  const size = Math.min(side, MAX_SIDE);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't process the photo");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process the photo"))), "image/jpeg", JPEG_QUALITY)
  );
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  return body?.error || body?.message || fallback;
}

/** Uploads the photo and returns its new URL. */
export async function uploadProfilePicture(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", await toSquareJpeg(file), "profile.jpg");
  const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.PROFILE_PICTURE, { method: "POST", body: form });
  if (!response.ok) throw new Error(await errorMessage(response, "Couldn't upload the photo"));
  return (await response.json()).pictureUrl;
}

/** Goes back to the Google account photo. */
export async function removeProfilePicture(): Promise<void> {
  const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.PROFILE_PICTURE, { method: "DELETE" });
  if (!response.ok) throw new Error(await errorMessage(response, "Couldn't remove the photo"));
}
