// Shared by client components and route handlers: keep it free of server imports

export const DEFAULT_AVATAR = "/avatars/default.svg";

export function pictureUrl(id: number | string) {
  return `/api/pictures/${id}`;
}

/**
 * Redirects an <img> to the binary route of a picture, or to the default
 * avatar when there is none. Not cached, since the main picture can change.
 */
export function redirectToPicture(id: number | string | null | undefined) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: id == null ? DEFAULT_AVATAR : pictureUrl(id),
      "Cache-Control": "no-store",
    },
  });
}
