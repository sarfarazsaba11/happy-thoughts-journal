import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";

export function FloatingWriteButton() {
  return (
    <Link
      to="/write"
      aria-label="Write a new entry"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_40px_-10px_oklch(0_0_0/0.6)] ring-1 ring-border transition hover:scale-105 active:scale-95 sm:bottom-10 sm:right-10 sm:h-16 sm:w-16"
    >
      <Pencil className="h-5 w-5" strokeWidth={1.75} />
    </Link>
  );
}
