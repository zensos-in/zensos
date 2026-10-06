/**
 * Parses an Instagram Reel or Post URL and generates the clean embed URL.
 * Supports URLs like:
 * - https://www.instagram.com/reel/C8xyz123/
 * - https://instagram.com/reel/C8xyz123/?igsh=...
 * - https://www.instagram.com/p/C8xyz123/
 * - https://www.instagram.com/tv/C8xyz123/
 */
export function getInstagramEmbedUrl(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Match /reel/CODE or /reels/CODE or /p/CODE or /tv/CODE or /share/reel/CODE
  const match = trimmed.match(/(?:instagram\.com|instagr\.am)\/(?:reel|reels|p|tv|share\/reel)\/([a-zA-Z0-9_-]+)/i);
  if (match && match[1]) {
    return `https://www.instagram.com/reel/${match[1]}/embed/`;
  }

  if (trimmed.includes("instagram.com") && trimmed.includes("/embed")) {
    return trimmed;
  }

  return null;
}

export function isValidInstagramUrl(url: string): boolean {
  return Boolean(getInstagramEmbedUrl(url));
}
