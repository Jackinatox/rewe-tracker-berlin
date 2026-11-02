"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateDisplayName } from "@/app/actions/profile";
import { authClient } from "@/lib/auth-client";
import { ShareButton } from "./share-button";
import { Button, Card, CardTitle, Input, Label } from "./ui";

export function AccountSettings({ name, username, email }: { name: string; username: string; email: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(name);
  const [pending, startTransition] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateDisplayName(displayName);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Gespeichert");
        router.refresh();
      }
    });
  }

  async function signOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <Card>
        <CardTitle>Dein öffentliches Dashboard</CardTitle>
        <p className="mb-3 text-sm text-ink-2">
          Jeder mit dem Link kann deine Besuche, Wertungen, Notizen und Fotos sehen.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/u/${username}`} className="font-medium text-brand">
            /u/{username}
          </Link>
          <ShareButton path={`/u/${username}`} title={`${name}s Rewe-Dashboard`} />
        </div>
      </Card>

      <Card>
        <CardTitle>Profil</CardTitle>
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label htmlFor="displayName">Anzeigename</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              required
            />
          </div>
          <div className="text-sm text-ink-2">
            Benutzername: <span className="font-medium text-ink">@{username}</span> · E-Mail:{" "}
            <span className="font-medium text-ink">{email}</span>
          </div>
          <Button type="submit" disabled={pending || displayName.trim() === name}>
            {pending ? "Speichern…" : "Speichern"}
          </Button>
        </form>
      </Card>

      <Button variant="secondary" onClick={signOut} className="w-full">
        <LogOut /> Abmelden
      </Button>
    </>
  );
}
