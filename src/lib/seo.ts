import type { Metadata } from "next";

/**
 * Per-page metadata (title/description + matching canonical, OpenGraph and Twitter fields).
 * Needed because Next.js inherits the *entire* parent openGraph/twitter object when a page
 * doesn't set its own — without this every marketing page would show the homepage's OG
 * title/description when shared on social media.
 */
export function pageMetadata({
  title,
  description,
  path,
  images,
}: {
  title: string;
  description: string;
  path: string;
  images?: string[];
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, ...(images ? { images } : {}) },
    twitter: { title, description, ...(images ? { images } : {}) },
  };
}
