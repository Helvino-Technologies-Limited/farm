import Image from "next/image";
import { cn } from "@/lib/utils";

export function AvepoLogo({
  className,
  size = 28,
  src,
}: {
  className?: string;
  size?: number;
  src?: string | null;
}) {
  return (
    <Image
      src={src || "/brand/avepo-logo.png"}
      alt="Avepo Smart Farm"
      width={size * 1.3}
      height={size}
      className={cn("object-contain", className)}
      priority
    />
  );
}
