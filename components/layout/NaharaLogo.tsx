import Image from "next/image";
import Link from "next/link";
import { LOGO_SRC } from "@/lib/constants/brand";
import { cn } from "@/lib/utils";

type NaharaLogoProps = {
  href?: string;
  className?: string;
};

export function NaharaLogo({ href = "/dashboard", className }: NaharaLogoProps) {
  const img = (
    <Image
      src={LOGO_SRC}
      alt="Nahara"
      width={320}
      height={90}
      className={cn("h-14 w-auto object-contain lg:h-16", className)}
      priority
    />
  );

  if (!href) return img;

  return (
    <Link href={href} className="block shrink-0 leading-none">
      {img}
    </Link>
  );
}
