import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { FloatingWriteButton } from "@/components/FloatingWriteButton";

type Entry = {
  id: string;
  mood: string;
  note: string;
  image_url: string | null;
  created_at: string;
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moodline — a quiet mood journal" },
      { name: "description", content: "A minimal mood feed. Write a note, pick a mood, share if you'd like." },
      { property: "og:title", content: "Moodline" },
      { property: "og:description", content: "A minimal mood feed." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-feed"],
    queryFn: async (): Promise<Entry[]> => {
      const { data, error } = await supabase
        .from("entries")
        .select("id, mood, note, image_url, created_at")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 pb-32 pt-16 sm:pt-24">
        <header className="mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Public feed</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
            How the world is{" "}
            <em className="italic bg-gradient-to-r from-fuchsia-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
              feeling
            </em>{" "}
            today.
          </h1>
        </header>


        {isLoading ? (
          <Skeletons />
        ) : !data || data.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-4">
            {data.map((e) => (
              <EntryCard key={e.id} entry={e} />
            ))}
          </ul>
        )}
      </main>
      <FloatingWriteButton />
    </div>
  );
}

function EntryCard({ entry }: { entry: Entry }) {
  return (
    <li className="group rounded-2xl border border-border bg-card/60 p-6 transition hover:border-border/80 hover:bg-card">
      <div className="flex items-start gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-2xl">
          {entry.mood}
        </div>
        <div className="min-w-0 flex-1">
          {entry.note ? (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
              {entry.note}
            </p>
          ) : (
            <p className="text-[15px] italic text-muted-foreground">No words today.</p>
          )}
          
          {entry.image_url && (
            <div className="mt-4 overflow-hidden rounded-xl border border-border/50">
              <img src={entry.image_url} alt="Entry mood" className="aspect-video w-full object-cover" />
            </div>
          )}

          
          <p className="mt-3 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </li>
  );
}

function Skeletons() {
  return (
    <ul className="space-y-4">
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-card/40" />
      ))}
    </ul>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-12 text-center">
      <p className="text-3xl">○</p>
      <p className="mt-4 text-sm text-muted-foreground">
        Nothing shared yet. Be the first to leave a note.
      </p>
    </div>
  );
}
