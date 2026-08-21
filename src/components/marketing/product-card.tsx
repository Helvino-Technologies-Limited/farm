import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { LucideIcon } from "lucide-react";

export function ProductCard({
  id,
  name,
  description,
  imageUrl,
  price,
  unitAbbr,
  isPoultry,
  gradient,
  icon: Icon,
}: {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  unitAbbr: string;
  isPoultry: boolean;
  gradient: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className={`relative h-44 w-full ${imageUrl ? "" : gradient}`}>
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon className="h-12 w-12 text-white/90" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold">{name}</h3>
        {description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>}
        <div className="mt-3 flex flex-1 items-end justify-between gap-2">
          <p className="font-semibold text-avepo-green">
            {isPoultry ? "Priced by age" : formatCurrency(price)}
            {!isPoultry && <span className="text-xs font-normal text-muted-foreground"> / {unitAbbr}</span>}
          </p>
          <Button render={<Link href={`/portal/book/${id}`} />} nativeButton={false} size="sm">
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
}
