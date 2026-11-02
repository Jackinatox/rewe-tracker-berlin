// Syncs data/stores.json into the store table. Safe to re-run.
// Rows are matched by Google place id, so a changed slug id is renamed in place (visits follow via ON UPDATE CASCADE).
import { db } from "../lib/db";
import { STORES, type Store } from "../lib/stores";

// Kept to a few round trips: the Vercel build runs far from the database, so per-row queries add up fast.
const existing = new Map((await db.store.findMany()).map((s) => [s.googlePlaceId, s]));

const created = await db.store.createMany({ data: STORES.filter((s) => !existing.has(s.googlePlaceId)) });

const changed = STORES.flatMap((store) => {
  const row = existing.get(store.googlePlaceId);
  const differs =
    row && Object.entries(store).some(([k, v]) => JSON.stringify(row[k as keyof Store]) !== JSON.stringify(v));
  return differs ? [{ id: row.id, store }] : [];
});
for (const { id, store } of changed) await db.store.update({ where: { id }, data: store });

const stale = await db.store.findMany({
  where: { id: { notIn: STORES.map((s) => s.id) } },
  select: { id: true, _count: { select: { visits: true } } },
});
const removable = stale.filter((s) => s._count.visits === 0).map((s) => s.id);
await db.store.deleteMany({ where: { id: { in: removable } } });

console.log(
  `Stores: ${created.count} added, ${changed.length} updated, ${removable.length} removed (${STORES.length} total)`,
);
const kept = stale.filter((s) => s._count.visits > 0);
if (kept.length) console.warn(`Kept ${kept.length} stores no longer in stores.json because they have visits:`, kept);
await db.$disconnect();
