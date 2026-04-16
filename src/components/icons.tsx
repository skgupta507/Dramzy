import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  ChevronLeftSquare,
  DatabaseBackup,
  FolderSync,
  Info,
  LogOut,
  type LucideProps,
  Minus,
  Moon,
  Play,
  Plus,
  Search,
  Sun,
  Tv,
  X,
  Check,
} from "lucide-react";

import { cn } from "@/lib/utils";

// Inline Discord SVG — replaces @irsyadadl/paranoid IconBrandDiscord
const IconBrandDiscord = ({ className, ...props }: LucideProps) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={cn("inline-block", className)}
    aria-hidden="true"
    {...(props as React.SVGProps<SVGSVGElement>)}
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.053a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03Z" />
  </svg>
);

// Inline Google SVG
const DashiconsGoogle = ({ className, ...props }: LucideProps) => (
  <svg
    width="1em"
    height="1em"
    className={cn("fill-foreground", className)}
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    {...(props as React.SVGProps<SVGSVGElement>)}
  >
    <path
      fillRule="evenodd"
      d="M17.6 8.5h-7.5v3h4.4c-.4 2.1-2.3 3.5-4.4 3.4c-2.6-.1-4.6-2.1-4.7-4.7c-.1-2.7 2-5 4.7-5.1c1.1 0 2.2.4 3.1 1.2l2.3-2.2C14.1 2.7 12.1 2 10.2 2c-4.4 0-8 3.6-8 8s3.6 8 8 8c4.6 0 7.7-3.2 7.7-7.8c-.1-.6-.1-1.1-.3-1.7z"
      clipRule="evenodd"
    />
  </svg>
);

export const Icons = {
  logo: ChevronLeftSquare,
  close: X,
  moon: Moon,
  sun: Sun,
  play: Play,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  tv: Tv,
  info: Info,
  logout: LogOut,
  search: Search,
  bookmark: Bookmark,
  discord: IconBrandDiscord,
  google: DashiconsGoogle,
  plus: Plus,
  minus: Minus,
  backup: DatabaseBackup,
  sync: FolderSync,
  check: Check,
};
