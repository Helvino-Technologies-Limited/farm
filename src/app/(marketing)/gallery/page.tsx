import type { Metadata } from "next";
import Image from "next/image";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Gallery — Avepo Smart Farm",
  description: "Photos from Avepo Smart Farm's poultry, seedling, crop and dairy operations.",
  path: "/gallery",
});

export default async function GalleryPage() {
  const images = await db.galleryImage.findMany({ orderBy: [{ featured: "desc" }, { sortOrder: "asc" }] });
  const categories = Array.from(new Set(images.map((i) => i.category).filter((c): c is string => !!c)));

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-avepo-green">Gallery</p>
      <h1 className="mt-2 text-4xl font-bold sm:text-5xl">A look at our farm</h1>
      {categories.length > 0 && (
        <p className="mt-3 text-base text-muted-foreground">Categories: {categories.join(" · ")}</p>
      )}

      {images.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed p-12 text-center text-base text-muted-foreground">
          Photos will be added here soon.
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <figure key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
              <Image src={img.imageUrl} alt={img.caption ?? "Farm photo"} fill className="object-cover transition-transform group-hover:scale-105" />
              {img.caption && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-xs text-white">{img.caption}</figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
