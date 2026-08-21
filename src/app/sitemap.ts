import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/portal/login`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/portal/register`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
