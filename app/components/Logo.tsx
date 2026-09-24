import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 text-text no-underline"
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="text-accent shrink-0"
      >
        <path d="M2.5 21h19" />
        <rect x="4" y="6" width="3.5" height="15" rx="0.8" />
        <rect x="8.5" y="3.5" width="3.5" height="17.5" rx="0.8" />
        <path d="M14.2 8.2l3.2-1.1 4.3 12.6-3.2 1.1z" />
      </svg>
      <span className="font-serif text-[32px] leading-none tracking-[-0.5px]">
        moodshelf
      </span>
    </Link>
  );
}
