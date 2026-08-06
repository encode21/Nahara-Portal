import Image from "next/image";
import Link from "next/link";
import { LOGO_BADGE_SRC, LOGO_SRC } from "@/lib/constants/brand";
import { cn } from "@/lib/utils";

type NaharaLogoProps = {
  href?: string;
  className?: string;
};

export function NaharaLogo({ href = "/dashboard", className }: NaharaLogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5 lg:gap-3", className)}>
      <Image
        src={LOGO_BADGE_SRC}
        alt="Paguyuban Warga Nahara — Cimanggis Golf Estate"
        width={72}
        height={72}
        className="h-11 w-11 shrink-0 object-contain sm:h-12 sm:w-12 lg:h-14 lg:w-14"
        priority
      />
      <Image
        src={LOGO_SRC}
        alt="Nahara"
        width={320}
        height={90}
        className="h-12 w-auto object-contain sm:h-14 lg:h-16"
        priority
      />
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block shrink-0 leading-none">
      {content}
    </Link>
  );
}
