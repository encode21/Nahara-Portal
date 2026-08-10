import Image from "next/image";
import Link from "next/link";
import { LOGO_BADGE_SRC, LOGO_WORDMARK_SRC } from "@/lib/constants/brand";
import { cn } from "@/lib/utils";

type NaharaLogoProps = {
  href?: string;
  className?: string;
};

export function NaharaLogo({ href = "/dashboard", className }: NaharaLogoProps) {
  const content = (
    <span className={cn("inline-flex min-w-0 max-w-full items-center gap-2 sm:gap-3", className)}>
      <Image
        src={LOGO_BADGE_SRC}
        alt=""
        width={128}
        height={128}
        sizes="(max-width: 640px) 40px, (max-width: 1024px) 56px, 64px"
        className="h-10 w-10 shrink-0 object-contain sm:h-14 sm:w-14 lg:h-16 lg:w-16"
        priority
        aria-hidden
      />
      <Image
        src={LOGO_WORDMARK_SRC}
        alt="Nahara"
        width={240}
        height={54}
        sizes="(max-width: 640px) 152px, 180px"
        className="h-6 w-auto max-w-[min(9.5rem,42vw)] object-contain object-left sm:h-8 sm:max-w-none lg:h-9"
        priority
      />
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block shrink-0 leading-none" aria-label="Nahara Portal Warga">
      {content}
    </Link>
  );
}
