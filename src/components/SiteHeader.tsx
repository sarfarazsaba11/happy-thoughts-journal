import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

const ADMIN_EMAIL = "admin@gmail.com";

export function SiteHeader() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
        <Link to="/" className="group flex items-center gap-2">
          <span className="text-lg bg-gradient-to-br from-fuchsia-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">●</span>
          <span className="font-serif text-xl tracking-tight">Moodline</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <>
              <Link
                to="/"
                className="rounded-full px-3 py-1.5 transition hover:text-foreground"
              >
                Feed
              </Link>
              <Link
                to="/write"
                className="rounded-full px-3 py-1.5 transition hover:text-foreground"
              >
                Write
              </Link>
              <Link
                to="/my"
                className="rounded-full px-3 py-1.5 transition hover:text-foreground"
              >
                My entries
              </Link>
              {profile?.is_admin && (
                <Link
                  to="/admin"
                  className="rounded-full px-3 py-1.5 transition hover:text-foreground font-medium text-primary"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/" });
                }}
                className="rounded-full px-3 py-1.5 transition hover:text-foreground"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="rounded-full px-3 py-1.5 transition hover:text-foreground"
            >
              Sign in
            </Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
