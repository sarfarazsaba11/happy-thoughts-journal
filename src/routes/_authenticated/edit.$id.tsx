import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const MOODS = ["😊", "😌", "🙂", "😐", "😔", "😢", "😡", "🤯", "😴", "✨", "🔥", "🌧️"];

export const Route = createFileRoute("/_authenticated/edit/$id")({
  head: () => ({ meta: [{ title: "Edit entry — Moodline" }] }),
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  const { data: entry, isLoading } = useQuery({
    queryKey: ["entry", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("id, mood, note, image_url, is_public, user_id")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (entry) {
      setMood(entry.mood);
      setNote(entry.note ?? "");
      setIsPublic(entry.is_public);
      setImageUrl(entry.image_url);
    }
  }, [entry]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset","new-preset");

    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME; 
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        toast.success("Image uploaded.");
      } else {
        throw new Error(data.error?.message || "Upload failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!mood) return toast.error("Pick a mood.");
    setSaving(true);
    const { error } = await supabase
      .from("entries")
      .update({ mood, note: note.trim(), is_public: isPublic, image_url: imageUrl })
      .eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Entry updated.");
    navigate({ to: "/my" });
  }

  async function handleDelete() {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted.");
    navigate({ to: "/my" });
  }

  if (isLoading || !entry) {
    return <div className="min-h-screen p-12 text-sm text-muted-foreground">Loading…</div>;
  }
  
  // Allow admin to edit any entry, or user to edit own
  // Wait, I should check context for profile
  const { profile } = Route.useRouteContext();
  if (entry.user_id !== user.id && !profile?.is_admin) {
    return <div className="min-h-screen p-12 text-sm text-muted-foreground">Not your entry.</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
        <Link to="/my" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <button
          onClick={handleDelete}
          className="text-sm text-muted-foreground hover:text-destructive"
        >
          Delete
        </button>
      </div>

      <main className="mx-auto max-w-2xl px-6 pb-32 pt-12">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Edit entry</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
          Update your{" "}
          <em className="italic bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            note
          </em>
          .
        </h1>

        <section className="mt-12">
          <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">Mood</p>
          <div className="grid grid-cols-6 gap-3 sm:grid-cols-12">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`flex aspect-square items-center justify-center rounded-2xl border text-2xl transition ${
                  mood === m
                    ? "border-foreground bg-accent scale-105"
                    : "border-border bg-card/60 hover:bg-card"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">Note</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            maxLength={2000}
            className="w-full resize-none rounded-2xl border border-input bg-card/60 p-5 font-serif text-lg leading-relaxed outline-none transition focus:border-ring"
          />
          <p className="mt-2 text-right text-xs text-muted-foreground">{note.length}/2000</p>
        </section>

        <section className="mt-10">
          <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">Image</p>
          {imageUrl ? (
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-border">
              <img src={imageUrl} alt="Uploaded" className="h-full w-full object-cover" />
              <button
                onClick={() => setImageUrl(null)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 py-12 transition hover:bg-card/60"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">Change image</span>
                </>
              )}
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </section>

        <section className="mt-8 flex items-center justify-between rounded-2xl border border-border bg-card/60 p-5">
          <div>
            <p className="text-sm font-medium">Share publicly</p>
            <p className="text-xs text-muted-foreground">Anonymous on the home feed.</p>
          </div>
          <button
            role="switch"
            aria-checked={isPublic}
            onClick={() => setIsPublic((v) => !v)}
            className={`relative h-7 w-12 rounded-full transition ${
              isPublic ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-background transition ${
                isPublic ? "left-6" : "left-1"
              }`}
            />
          </button>
        </section>

        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="mt-10 h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </main>
    </div>
  );
}

