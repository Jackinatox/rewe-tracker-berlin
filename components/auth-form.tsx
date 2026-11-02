"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button, Card, Input, Label } from "./ui";

const ERRORS: Record<string, string> = {
  USERNAME_IS_ALREADY_TAKEN: "Dieser Benutzername ist schon vergeben.",
  USER_ALREADY_EXISTS: "Mit dieser E-Mail gibt es schon ein Konto.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Mit dieser E-Mail gibt es schon ein Konto.",
  INVALID_USERNAME_OR_PASSWORD: "Benutzername oder Passwort falsch.",
  INVALID_EMAIL_OR_PASSWORD: "E-Mail oder Passwort falsch.",
  INVALID_USERNAME: "Benutzername ungültig oder reserviert (erlaubt: Buchstaben, Zahlen, - und _).",
  USERNAME_TOO_SHORT: "Benutzername: mindestens 3 Zeichen.",
  USERNAME_TOO_LONG: "Benutzername: höchstens 24 Zeichen.",
  PASSWORD_TOO_SHORT: "Passwort: mindestens 8 Zeichen.",
  PASSWORD_TOO_LONG: "Passwort ist zu lang.",
  INVALID_EMAIL: "Ungültige E-Mail-Adresse.",
};

const message = (error: { code?: string; message?: string }) =>
  (error.code && ERRORS[error.code]) || error.message || "Etwas ist schiefgelaufen.";

/** Only allow same-site relative redirects. */
const safeNext = (next: string | undefined) => (next?.startsWith("/") && !next.startsWith("//") ? next : null);

export function SignInForm({ next }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const login = String(form.get("login")).trim();
    const password = String(form.get("password"));
    setPending(true);
    setError(null);
    const { data, error } = login.includes("@")
      ? await authClient.signIn.email({ email: login, password })
      : await authClient.signIn.username({ username: login, password });
    setPending(false);
    if (error) return setError(message(error));
    const username = (data?.user as { username?: string } | undefined)?.username;
    router.push((safeNext(next) ?? (username ? `/u/${username}` : "/")) as Route);
    router.refresh();
  }

  return (
    <Card className="mx-auto max-w-sm">
      <h1 className="mb-4 text-xl font-bold">Anmelden</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="login">Benutzername oder E-Mail</Label>
          <Input id="login" name="login" required autoComplete="username" autoCapitalize="none" />
        </div>
        <div>
          <Label htmlFor="password">Passwort</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        {error && <p className="text-sm text-critical">{error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Anmelden…" : "Anmelden"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-2">
        Noch kein Konto?{" "}
        <Link
          href={(next ? `/registrieren?next=${encodeURIComponent(next)}` : "/registrieren") as Route}
          className="font-medium text-brand"
        >
          Registrieren
        </Link>
      </p>
    </Card>
  );
}

export function SignUpForm({ next }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [username, setUsername] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.signUp.email({
      name: String(form.get("name")).trim(),
      username: username.trim(),
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });
    setPending(false);
    if (error) return setError(message(error));
    router.push((safeNext(next) ?? `/u/${username.trim().toLowerCase()}`) as Route);
    router.refresh();
  }

  return (
    <Card className="mx-auto max-w-sm">
      <h1 className="mb-1 text-xl font-bold">Registrieren</h1>
      <p className="mb-4 text-sm text-ink-2">Dein Dashboard ist öffentlich, damit du es mit Freunden teilen kannst.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Anzeigename</Label>
          <Input id="name" name="name" required maxLength={40} autoComplete="nickname" placeholder="z. B. Alex" />
        </div>
        <div>
          <Label htmlFor="username">Benutzername</Label>
          <Input
            id="username"
            name="username"
            required
            minLength={3}
            maxLength={24}
            pattern="[A-Za-z0-9_\-]+"
            autoCapitalize="none"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted">
            Dein Link: /u/{username.trim().toLowerCase() || "name"} · Buchstaben, Zahlen, - und _
          </p>
        </div>
        <div>
          <Label htmlFor="email">E-Mail</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">Passwort</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          <p className="mt-1 text-xs text-muted">Mindestens 8 Zeichen</p>
        </div>
        {error && <p className="text-sm text-critical">{error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Konto wird erstellt…" : "Konto erstellen"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-2">
        Schon registriert?{" "}
        <Link href="/anmelden" className="font-medium text-brand">
          Anmelden
        </Link>
      </p>
    </Card>
  );
}
