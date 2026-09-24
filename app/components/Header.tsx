import { Code2 } from "lucide-react";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-6 sm:px-10 lg:px-20 border-b border-border">
      <Logo />
      <nav className="flex items-center gap-8 text-sm font-medium">
        <a
          href="https://github.com/hannahnmcdonald/moodshelf#readme"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 min-h-11 text-text-muted no-underline hover:text-text-soft"
        >
          <Code2 size={18} aria-hidden="true" />
          How it&apos;s built
        </a>
      </nav>
    </header>
  );
}
