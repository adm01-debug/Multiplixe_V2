const WIDTH_PARAMS = ["w", "width"] as const;

/**
 * Builds a responsive srcset only for CDNs that already expose a width query
 * parameter on the URL (Unsplash/imgix style). Returning undefined keeps the
 * browser on the original src, which is the safe default for any CDN whose
 * resizing contract we do not control.
 */
export const buildImageSrcSet = (
  url: string | undefined,
  widths: number[] = [320, 480, 640, 960, 1280],
): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("data:") || url.startsWith("blob:")) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(url, "https://placeholder.local");
  } catch {
    return undefined;
  }

  const widthParam = WIDTH_PARAMS.find((param) => parsed.searchParams.has(param));
  if (!widthParam) return undefined;

  const declared = Number(parsed.searchParams.get(widthParam));
  const usable = Number.isFinite(declared) && declared > 0
    ? widths.filter((width) => width <= declared)
    : widths;
  const target = usable.length > 0 ? usable : [widths[0]];

  return target
    .map((width) => {
      const variant = new URL(parsed.toString());
      variant.searchParams.set(widthParam, String(width));
      return `${variant.toString()} ${width}w`;
    })
    .join(", ");
};