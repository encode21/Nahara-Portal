import Image from "next/image";
import Link from "next/link";
import { LOGO_BADGE_SRC } from "@/lib/constants/brand";
import { cn } from "@/lib/utils";

type NaharaLogoProps = {
  href?: string;
  className?: string;
};

export function NaharaLogo({ href = "/dashboard", className }: NaharaLogoProps) {
  const img = (
    <Image
      src={LOGO_BADGE_SRC}
      alt="Paguyuban Warga Nahara — Cimanggis Golf Estate"
      width={160}
      height={160}
      className={cn(
        "h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14 lg:h-16 lg:w-16",
        className,
      )}
      priority
    />
  );

  if (!href) return img;

  return (
    <Link href={href} className="block shrink-0 leading-none" aria-label="Nahara Portal Warga">
      {img}
    </Link>
  );
}
