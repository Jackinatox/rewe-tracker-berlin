# Rewe-Tracker Berlin

Welcher Rewe in Berlin ist der beste? Besuche eintragen, mit Sternen bewerten (gesamt + Frische, Auswahl, Andrang,
Kasse, Sauberkeit, Personal), Fotos anhängen und das eigene Dashboard unter `/u/<benutzername>` mit Freunden teilen.

Next.js 16 · Better Auth (E-Mail/Passwort + Benutzername) · Prisma 7 + Postgres · Vercel Blob · Leaflet/OpenStreetMap ·
recharts. Läuft komplett im Free Tier von Vercel + Neon.

## Lokal starten

```bash
bun install
cp .env.example .env          # BETTER_AUTH_SECRET setzen: openssl rand -base64 32
bun run db:up                 # Postgres in Docker auf Port 5434
bun run db:deploy && bunx prisma generate
bun run db:seed               # 156 Märkte aus data/stores.json
bun run dev                   # http://localhost:3000
```

Ohne `BLOB_READ_WRITE_TOKEN` landen Fotos im Dev-Modus in `public/uploads/` (gitignored). In Produktion ohne Token
sind Foto-Uploads ausgeblendet.

Nützlich: `bun run lint`, `bun run typecheck`, `bun run db:studio`, `bun run db:migrate` (nach Schema-Änderungen).

## Marktdaten

`data/stores.json` ist einmalig erzeugt und eingecheckt (Stand November 2026: 156 REWE/REWE City/REWE Center in Berlin,
ohne REWE To Go, Getränkemärkte, Lieferlager). Neu erzeugen:

```bash
curl -o /tmp/bezirke.geojson https://tsb-opendata.s3.eu-central-1.amazonaws.com/bezirksgrenzen/bezirksgrenzen.geojson
GRID=10 bun --env-file=<datei mit GOOGLE_MAPS_API_KEY> scripts/fetch-stores.ts /tmp/bezirke.geojson
bun run db:seed
```

Das Skript fragt die Google Places API (Text Search, ~100 Requests) in Kacheln über Berlin ab, filtert, ordnet per
Punkt-in-Polygon den Bezirk zu und gleicht mit OpenStreetMap ab (Abweichungen werden ausgegeben). Rohdaten landen in
`scripts/.cache/`; mit `--cached` lassen sich Filter ohne neue API-Kosten anpassen. Der Seed gleicht über die Google
Place-ID ab, umbenannte Märkte behalten also ihre Besuche.

## Deployment (Vercel + Neon, kostenlos)

1. Repo zu GitHub pushen und in Vercel importieren (Framework: Next.js, Bun wird über `bun.lock` erkannt).
2. Vercel → Storage → **Neon** hinzufügen (setzt `DATABASE_URL` und `DATABASE_URL_UNPOOLED`).
3. Vercel → Storage → **Blob** hinzufügen (setzt `BLOB_READ_WRITE_TOKEN`).
4. Env-Variablen setzen: `BETTER_AUTH_SECRET` (neu generieren) und `BETTER_AUTH_URL` (z. B. `https://rewe.example.com`).
5. Deployen. `vercel-build` führt Migrationen und den Seed aus.
6. Eigene Subdomain: Vercel → Domains → hinzufügen, beim DNS-Anbieter einen CNAME auf `cname.vercel-dns.com` setzen,
   dann `BETTER_AUTH_URL` auf die Subdomain ändern und neu deployen.
