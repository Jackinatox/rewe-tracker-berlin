"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui";

export function ShareButton({ path, title }: { path: string; title: string }) {
  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // dismissed
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link kopiert");
  }

  return (
    <Button variant="secondary" size="sm" onClick={share}>
      <Share2 /> Teilen
    </Button>
  );
}
