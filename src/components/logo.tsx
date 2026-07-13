import Image from "next/image";
import { cn } from "@/lib/utils";

// Full wordmark — wide lockup, for headers/panels with room to breathe.
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Plastio.xe"
      width={1445}
      height={311}
      priority
      className={cn("h-8 w-auto object-contain", className)}
    />
  );
}

// Icon-only mark — square crop, for tight spaces (collapsed sidebar, avatars).
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-icon.png"
      alt="Plastio.xe"
      width={305}
      height={311}
      className={cn("size-8 object-contain", className)}
    />
  );
}
