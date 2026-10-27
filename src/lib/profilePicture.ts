import { API_CONFIG, authenticatedFetch } from "@/lib/api";

async function errorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  return body?.error || body?.message || fallback;
}

/** Uploads an already cropped photo (see PhotoCropper) and returns its new URL. */
export async function uploadProfilePicture(photo: Blob): Promise<string> {
  const form = new FormData();
  form.append("file", photo, "profile.jpg");
  const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.PROFILE_PICTURE, { method: "POST", body: form });
  if (!response.ok) throw new Error(await errorMessage(response, "Couldn't upload the photo"));
  return (await response.json()).pictureUrl;
}

/** Goes back to the Google account photo. */
export async function removeProfilePicture(): Promise<void> {
  const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.PROFILE_PICTURE, { method: "DELETE" });
  if (!response.ok) throw new Error(await errorMessage(response, "Couldn't remove the photo"));
}
