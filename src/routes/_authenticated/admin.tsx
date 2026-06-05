import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

const ADMIN_EMAIL = "admin@gmail.com";

type AdminEntry = {
  id: string;
  user_id: string;
  user_email: string | null;
  mood: string;
  note: string;
  image_url: string | null;
  is_public: boolean;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Moodline" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();

  const isAdmin = user.email === ADMIN_EMAIL;

  const entriesQuery = useQuery({
    queryKey: ["admin-entries"],
    enabled: isAdmin,
    queryFn: async (): Promise<AdminEntry[]> => {
      const { data, error } = await supabase.rpc("admin_list_entries");
      if (error) throw error;
      return (data ?? []) as AdminEntry[];
    },
  });

  const userCountQuery = useQuery({
    queryKey: ["admin-user-count"],
    enabled: isAdmin,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc("admin_user_count");
      if (error) throw error;
      return (data as number) ?? 0;
    },
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from("mood_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted.");
    qc.invalidateQueries({ queryKey: ["admin-entries"] });
    qc.invalidateQueries({ queryKey: ["public-feed"] });
  }

  async function handleTogglePublic(entry: AdminEntry) {
    const { error } = await supabase
      .from("mood_entries")
      .update({ is_public: !entry.is_public })
      .eq("id", entry.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-entries"] });
    qc.invalidateQueries({ queryKey: ["public-feed"] });
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-6 pt-24 text-center">
          <h1 className="font-serif text-3xl">Not authorized</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This area is for the admin only.
          </p>
          <Link to="/" className="mt-6 inline-block text-sm underline">
            Back home
          </Link>
        </main>
      </div>
    );
  }

  const entries = entriesQuery.data ?? [];
  const totalEntries = entries.length;
  const totalUsers = userCountQuery.data ?? 0;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pb-32 pt-12">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
          Dashboard
        </h1>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:max-w-md">
          <StatCard label="Total entries" value={totalEntries} />
          <StatCard label="Total users" value={totalUsers} />
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card/40">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Mood</th>
                  <th className="px-4 py-3 text-left font-medium">Note</th>
                  <th className="px-4 py-3 text-left font-medium">Image</th>
                  <th className="px-4 py-3 text-left font-medium">Public</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {entriesQuery.isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      No entries yet.
                    </td>
                  </tr>
                ) : (
                  entries.map((e) => (
                    <tr key={e.id} className="border-t border-border/60 hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs">{e.user_email ?? "—"}</td>
                      <td className="px-4 py-3 text-xl">{e.mood}</td>
                      <td className="max-w-xs px-4 py-3 text-xs">
                        <p className="truncate">{e.note || <span className="italic text-muted-foreground">—</span>}</p>
                      </td>
                      <td className="px-4 py-3">
                        {e.image_url ? (
                          <a href={e.image_url} target="_blank" rel="noreferrer">
                            <img
                              src={e.image_url}
                              alt=""
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          role="switch"
                          aria-checked={e.is_public}
                          onClick={() => handleTogglePublic(e)}
                          className={`relative h-6 w-11 rounded-full transition ${
                            e.is_public ? "bg-primary" : "bg-muted"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition ${
                              e.is_public ? "left-[22px]" : "left-0.5"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(e.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-6">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-4xl tracking-tight">{value}</p>
    </div>
  );
}
