import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";

function imageExists(filename: string): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", "images", "operations", filename));
  } catch {
    return false;
  }
}

export function OperationCard({
  filename,
  label,
  description,
  icon: Icon,
  gradient,
}: {
  filename: string;
  label: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
}) {
  const hasPhoto = imageExists(filename);

  return (
    <div className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className={`relative h-40 w-full ${hasPhoto ? "" : gradient}`}>
        {hasPhoto ? (
          <Image
            src={`/images/operations/${filename}`}
            alt={label}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon className="h-12 w-12 text-white/90" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold">{label}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
