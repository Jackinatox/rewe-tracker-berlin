// Syncs data/stores.json into the store table. Safe to re-run.
// Rows are matched by Google place id, so a changed slug id is renamed in place (visits follow via ON UPDATE CASCADE).
import { db } from "../lib/db";
import { STORES } from "../lib/stores";

const existing = new Map(
  (await db.store.findMany({ select: { id: true, googlePlaceId: true } })).map((s) => [s.googlePlaceId, s.id]),
);

await db.$transaction(
  STORES.map((store) => {
    const currentId = existing.get(store.googlePlaceId);
    return currentId ? db.store.update({ where: { id: currentId }, data: store }) : db.store.create({ data: store });
  }),
);

const stale = await db.store.findMany({
  where: { id: { notIn: STORES.map((s) => s.id) } },
  select: { id: true, _count: { select: { visits: true } } },
});
const removable = stale.filter((s) => s._count.visits === 0).map((s) => s.id);
await db.store.deleteMany({ where: { id: { in: removable } } });

console.log(`Seeded ${STORES.length} stores${removable.length ? `, removed ${removable.length} stale` : ""}`);
const kept = stale.filter((s) => s._count.visits > 0);
if (kept.length) console.warn(`Kept ${kept.length} stores no longer in stores.json because they have visits:`, kept);
await db.$disconnect();
