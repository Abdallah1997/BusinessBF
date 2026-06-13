import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  badgeText?: string;
  href: string;
}

/**
 * Reusable feature card. Orange/matte-black brand. Internal hrefs use Next
 * Link; external/hash hrefs fall back to a plain anchor.
 */
export default function FeatureCard({ icon, title, description, badgeText, href }: FeatureCardProps) {
  const isInternal = href.startsWith("/");
  const className =
    "group relative block w-full overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900";

  const inner = (
    <>
      {badgeText && (
        <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-950/50 dark:text-orange-300">
          {badgeText}
        </span>
      )}
      <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-orange-50 p-3 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-neutral-100">{title}</h3>
      <p className="text-base leading-relaxed text-zinc-500 dark:text-neutral-400">{description}</p>
      <div className="mt-4 flex items-center font-medium text-orange-600 dark:text-orange-400">
        Learn more
        <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </>
  );

  return isInternal ? (
    <Link href={href} className={className}>{inner}</Link>
  ) : (
    <a href={href} className={className}>{inner}</a>
  );
}
