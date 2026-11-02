import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="space-y-3 py-16 text-center">
      <div className="text-5xl" aria-hidden>
        🛒
      </div>
      <h1 className="text-xl font-bold">Hier gibt&apos;s nichts zu kaufen</h1>
      <p className="text-ink-2">Diese Seite existiert nicht.</p>
      <LinkButton href="/">Zur Karte</LinkButton>
    </div>
  );
}
