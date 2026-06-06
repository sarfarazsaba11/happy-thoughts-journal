import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Pencil, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/_authenticated/admin")({
  
beforeLoad: ({ context }) => {
  console.log("acbd",context.profile?.is_admin)
  if (!context.profile?.is_admin) {
    throw redirect({ to: "/" });
  }
},
  head: () => ({ meta: [{ title: "Admin Dashboard — Moodline" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const qc = useQueryClient();
  const { data: entries, isLoading } = useQuery({
    queryKey: ["admin-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry as admin?")) return;
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Entry deleted.");
    qc.invalidateQueries({ queryKey: ["admin-entries"] });
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 pb-32 pt-16">
        <header className="mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight">Dashboard</h1>
        </header>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading entries…</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Mood</th>
                  <th className="px-6 py-4 font-medium">Image</th>
                  <th className="px-6 py-4 font-medium">Note</th>
                  <th className="px-6 py-4 font-medium">User ID</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries?.map((e) => (
                  <tr key={e.id} className="group hover:bg-muted/30">
                    <td className="whitespace-nowrap px-6 py-4 text-2xl">{e.mood}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {e.image_url ? (
                        <div className="h-10 w-16 overflow-hidden rounded-md border border-border/50">
                          <img
                            src={e.image_url}
                            alt="Entry"
                            className="h-full w-full object-cover transition hover:scale-110"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No image</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="line-clamp-2 max-w-md">{e.note || <span className="italic text-muted-foreground">No note</span>}</p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-[10px] text-muted-foreground">{e.user_id}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                      {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to="/edit/$id"
                          params={{ id: e.id }}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
