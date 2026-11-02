import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Toaster } from "sonner";
import { DesktopNav, MobileNav } from "@/components/nav";
import { getSession } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000"),
  title: { default: "Rewe-Tracker Berlin", template: "%s · Rewe-Tracker" },
  description: "Welcher Rewe in Berlin ist der beste? Besuche eintragen, bewerten, Fortschritt teilen.",
  applicationName: "Rewe-Tracker",
  appleWebApp: { capable: true, title: "Rewe-Tracker", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#cc071e" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a19" },
  ],
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const username = session?.user.username ?? null;

  return (
    <html lang="de">
      <body className="min-h-dvh font-sans antialiased">
        <header className="sticky top-0 z-20 border-b border-line bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex size-7 items-center justify-center rounded-md bg-brand text-sm font-bold text-white">
                R
              </span>
              Rewe-Tracker
            </Link>
            <DesktopNav username={username} />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 pt-4 pb-28 sm:pb-12">{children}</main>
        <footer className="mx-auto hidden max-w-5xl px-4 pb-8 text-xs text-muted sm:block">
          Privates Projekt, kein Angebot der REWE Group. Kartendaten © OpenStreetMap-Mitwirkende, Marktdaten via Google
          Maps.
        </footer>
        <MobileNav username={username} />
        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  );
}
