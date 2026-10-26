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

function endsWith(buffer: Buffer, bytes: number[]): boolean {
  return startsWith(buffer, bytes, buffer.length - bytes.length);
}

// PNG: last chunk must be IEND (length 0, type "IEND", fixed CRC)
const PNG_IEND = [0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82];

/**
 * Checks that the file is not truncated: JPEG ends with the EOI marker (FFD9,
 * trailing zero padding tolerated), PNG ends with the IEND chunk, and the RIFF
 * size of a WebP matches the actual file size.
 */
function isCompleteImage(buffer: Buffer, mimeType: string): boolean {
  switch (mimeType) {
    case "image/jpeg": {
      let end = buffer.length;
      while (end > 0 && buffer[end - 1] === 0x00)
        end--;
      return end >= 4 && buffer[end - 2] === 0xff && buffer[end - 1] === 0xd9;
    }
    case "image/png":
      return buffer.length >= 8 + 12 && endsWith(buffer, PNG_IEND);
    case "image/webp":
      // RIFF size (little endian, offset 4) counts everything after the first 8 bytes
      return buffer.length >= 12 && buffer.readUInt32LE(4) + 8 === buffer.length;
    default:
      return false;
  }
}

/**
 * Validates an uploaded image: allowed type from its magic bytes, and a
 * complete (non-truncated) file.
 * @returns The MIME type, or null if the content is not a valid allowed image.
 */
export function validateImage(buffer: Buffer): string | null {
  const mimeType = detectImageMimeType(buffer);
  if (!mimeType || !isCompleteImage(buffer, mimeType))
    return null;
  return mimeType;
}
