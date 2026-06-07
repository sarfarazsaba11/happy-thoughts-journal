import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { dataTagErrorSymbol } from "@tanstack/react-query";
import { constructFromSymbol } from "date-fns/constants";

const MOODS = ["😊", "😌", "🙂", "😐", "😔", "😢", "😡", "🤯", "😴", "✨", "🔥", "🌧️"];

export const Route = createFileRoute("/_authenticated/write")({
  head: () => ({
    meta: [
      { title: "New entry — Moodline" },
      { name: "description", content: "Capture today in one note." },
    ],
  }),
  component: WritePage,
});

function WritePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET); // User should replace this or I can use a placeholder

    try {
      // Note: In a real app, you'd use your own cloud name
     const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  formData.append("file", file);
  formData.append("upload_preset",uploadPreset); // ← required
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
    if (!mood) {
      toast.error("Pick a mood first.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("entries").insert({
      user_id: user.id,
      mood,
      note: note.trim(),
      is_public: isPublic,
      image_url: imageUrl,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(isPublic ? "Shared to the feed." : "Saved privately.");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/" });
          }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Sign out
        </button>
      </div>

      <main className="mx-auto max-w-2xl px-6 pb-32 pt-12">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">New entry</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
          How are you, <em className="italic">really</em>?
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
            placeholder="A line. A page. Whatever the day asks for."
            maxLength={2000}
            className="w-full resize-none rounded-2xl border border-input bg-card/60 p-5 font-serif text-lg leading-relaxed outline-none transition focus:border-ring"
          />
          <p className="mt-2 text-right text-xs text-muted-foreground">{note.length}/2000</p>
        </section>


        <section className="mt-8">
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
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">Add an image</span>
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
          {saving ? "Saving…" : "Save entry"}
        </button>
      </main>
    </div>
  );
}

