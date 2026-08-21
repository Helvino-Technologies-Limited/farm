"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface BrowserProduct {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  unitAbbr: string;
  isPoultry: boolean;
  centre: string;
  centreLabel: string;
}

export function ProductBrowser({
  products,
  centreOrder,
  centreIcons,
  centreGradients,
}: {
  products: BrowserProduct[];
  centreOrder: string[];
  centreIcons: Record<string, LucideIcon>;
  centreGradients: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [activeCentre, setActiveCentre] = useState<string | "ALL">("ALL");

  const availableCentres = useMemo(
    () => centreOrder.filter((c) => products.some((p) => p.centre === c)),
    [centreOrder, products]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.centreLabel.toLowerCase().includes(q);
      const matchesCentre = activeCentre === "ALL" || p.centre === activeCentre;
      return matchesQuery && matchesCentre;
    });
  }, [products, query, activeCentre]);

  const grouped = useMemo(() => {
    const map = new Map<string, BrowserProduct[]>();
    for (const p of filtered) {
      if (!map.has(p.centre)) map.set(p.centre, []);
      map.get(p.centre)!.push(p);
    }
    return map;
  }, [filtered]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products & services..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeCentre === "ALL" ? "default" : "outline"}
            onClick={() => setActiveCentre("ALL")}
          >
            All
          </Button>
          {availableCentres.map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={activeCentre === c ? "default" : "outline"}
              onClick={() => setActiveCentre(c)}
            >
              {products.find((p) => p.centre === c)?.centreLabel ?? c}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          No products match your search.
        </div>
      ) : (
        <div className="space-y-12">
          {Array.from(grouped.entries()).map(([centre, items]) => {
            const Icon = centreIcons[centre];
            const gradient = centreGradients[centre];
            return (
              <div key={centre}>
                <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                  {Icon && <Icon className="h-5 w-5 text-avepo-green" />}
                  {items[0]?.centreLabel ?? centre}
                </h3>
                <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-px-2 [-webkit-overflow-scrolling:touch]">
                  {items.map((p) => (
                    <Link
                      key={p.id}
                      href={`/portal/book/${p.id}`}
                      className="group w-64 shrink-0 snap-start overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className={`relative h-40 w-full ${p.imageUrl ? "" : gradient}`}>
                        {p.imageUrl ? (
                          <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="256px" />
                        ) : (
                          Icon && (
                            <div className="flex h-full w-full items-center justify-center">
                              <Icon className="h-10 w-10 text-white/90" strokeWidth={1.5} />
                            </div>
                          )
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold group-hover:underline">{p.name}</h4>
                        {p.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                        )}
                        <p className="mt-2 font-semibold text-avepo-green">
                          {p.isPoultry ? "Priced by age" : formatCurrency(p.price)}
                          {!p.isPoultry && <span className="text-xs font-normal text-muted-foreground"> / {p.unitAbbr}</span>}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
