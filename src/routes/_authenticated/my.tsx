import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Pencil, Trash2, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { FloatingWriteButton } from "@/components/FloatingWriteButton";

type Entry = {
  id: string;
  mood: string;
  note: string;
  image_url: string | null;
  is_public: boolean;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/my")({
  head: () => ({ meta: [{ title: "My entries — Moodline" }] }),
  component: MyEntries,
});

function MyEntries() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["my-entries", user.id],
    queryFn: async (): Promise<Entry[]> => {
      const { data, error } = await supabase
        .from("entries")
        .select("id, mood, note, image_url, is_public, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry? This cannot be undone.")) return;
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Entry deleted.");
    qc.invalidateQueries({ queryKey: ["my-entries", user.id] });
    qc.invalidateQueries({ queryKey: ["public-feed"] });
  }

  async function togglePublic(entry: Entry) {
    const { error } = await supabase
      .from("entries")
      .update({ is_public: !entry.is_public })
      .eq("id", entry.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["my-entries", user.id] });
    qc.invalidateQueries({ queryKey: ["public-feed"] });
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 pb-32 pt-16">
        <header className="mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your journal</p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
            Your{" "}
            <em className="italic bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              moods
            </em>
            .
          </h1>
        </header>

        {isLoading ? (
          <ul className="space-y-4">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-card/40" />
            ))}
          </ul>
        ) : !data || data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-3xl">○</p>
            <p className="mt-4 text-sm text-muted-foreground">
              No entries yet. Tap the pencil to start.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {data.map((e) => (
              <li
                key={e.id}
                className="group rounded-2xl border border-border bg-card/60 p-6 transition hover:border-border/80 hover:bg-card"
              >
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-2xl">
                    {e.mood}
                  </div>
                  <div className="min-w-0 flex-1">
                    {e.note ? (
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
                        {e.note}
                      </p>
                    ) : (
                      <p className="text-[15px] italic text-muted-foreground">No words today.</p>
                    )}


                    {e.image_url && (
                      <div className="mt-4 overflow-hidden rounded-xl border border-border/50">
                        <img src={e.image_url} alt="Entry mood" className="aspect-video w-full object-cover" />
                      </div>
                    )}


                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => togglePublic(e)}
                          title={e.is_public ? "Make private" : "Share publicly"}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                          {e.is_public ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </button>
                        <Link
                          to="/edit/$id"
                          params={{ id: e.id }}
                          title="Edit"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(e.id)}
                          title="Delete"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <FloatingWriteButton />
    </div>
  );
}
