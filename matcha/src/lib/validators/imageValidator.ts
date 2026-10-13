// matcha/src/lib/validators/imageValidator.ts

// nginx caps request bodies at 5M; keep margin for multipart overhead
export const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function startsWith(buffer: Buffer, bytes: number[], offset = 0): boolean {
  if (buffer.length < offset + bytes.length) return false;
  return bytes.every((b, i) => buffer[offset + i] === b);
}

/**
 * Detects the image type from its magic bytes, ignoring any client-provided MIME type.
 * @returns The MIME type, or null if the content is not an allowed image.
 */
export function detectImageMimeType(buffer: Buffer): string | null {
  if (startsWith(buffer, [0xff, 0xd8, 0xff]))
    return "image/jpeg";
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return "image/png";
  // RIFF....WEBP
  if (startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) && startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8))
    return "image/webp";
  return null;
}
