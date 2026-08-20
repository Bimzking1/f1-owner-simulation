// F1 Owner — asset seeder + dictionary generator.
//
// Usage:  npm run assets:seed   (or: npx tsx scripts/seed-assets.ts)
//
// 1. Copies public/dummy.png onto every placeholder (`dummyNNN.png`) path
//    declared in src/data/assets.ts (assetManifest) so no <img> 404s.
// 2. Overlays real constructor art from the overrides map (drop your own
//    images in src/assets/constructors/, add a row below, re-run).
// 3. Regenerates /ASSET_DICTIONARY.md — the human-readable replacement map.
//
// Replacing art = overwrite the file at public/assets/images/<cat>/<file>
// with the same filename. No code changes needed.

import { existsSync, mkdirSync, copyFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { assetManifest, assetPaths } from "../src/data/assets";

const ROOT = process.cwd();
const PLACEHOLDER = resolve(ROOT, "public/dummy.png");

if (!existsSync(PLACEHOLDER)) {
  console.error("placeholder missing: public/dummy.png");
  process.exit(1);
}

// real art overrides: manifest filename → source image under src/assets/
const OVERRIDES: Record<string, string> = {
  "dummy021.png": "src/assets/ferrari.png", // Ferrari logo
  "dummy022.png": "src/assets/redbull.png", // Red Bull Racing logo
  "dummy023.png": "src/assets/mercedes.png", // Mercedes-AMG logo
  "dummy024.png": "src/assets/mclaren.png", // McLaren logo
  "dummy029.png": "src/assets/williams.png", // Williams Racing logo
};

let copied = 0;
let overlaid = 0;
const byCategory = new Map<string, { filename: string; description: string; seasons: string; usedBy: string }[]>();

for (const entry of assetManifest) {
  const dir = resolve(ROOT, `public/assets/images/${entry.category}`);
  const out = resolve(dir, entry.filename);
  mkdirSync(dir, { recursive: true });
  if (!existsSync(out)) {
    copyFileSync(PLACEHOLDER, out);
    copied++;
  }
  const override = OVERRIDES[entry.filename];
  if (override) {
    const src = resolve(ROOT, override);
    if (!existsSync(src)) {
      console.error(`override source missing: ${override}`);
      process.exit(1);
    }
    copyFileSync(src, out);
    overlaid++;
  }
  const list = byCategory.get(entry.category) ?? [];
  list.push(entry);
  byCategory.set(entry.category, list);
}

// verify every declared asset path resolves to a real file
const declared: string[] = [];
(function walk(o: Record<string, unknown>) {
  for (const v of Object.values(o)) {
    if (typeof v === "string" && v.startsWith("/assets/images/")) declared.push(v);
    else if (v && typeof v === "object") walk(v as Record<string, unknown>);
  }
})(assetPaths as unknown as Record<string, unknown>);

const unresolved = declared.filter((p) => !existsSync(resolve(ROOT, "public" + p)));

console.log(`seeded ${copied} placeholders, overlaid ${overlaid} real images, ${declared.length} paths checked`);
if (unresolved.length) {
  console.error("UNRESOLVED PATHS:");
  unresolved.forEach((p) => console.error("  " + p));
  process.exit(1);
}

// ---- ASSET_DICTIONARY.md -------------------------------------------------
const categories = [...byCategory.keys()].sort();
const lines: string[] = [];
lines.push("# F1 Owner — Asset Dictionary");
lines.push("");
lines.push("Every image is served from `public/assets/images/<category>/<file>` and");
lines.push("declared in `src/data/assets.ts` (`assetManifest` + `assetPaths`).");
lines.push("");
lines.push("## How to replace placeholder art");
lines.push("");
lines.push("1. Find the file in the table below (or the folder `public/assets/images/<category>/`).");
lines.push("2. Overwrite that file with your real image — **keep the same filename**.");
lines.push("3. Refresh. No code changes, no rebuild needed.");
lines.push("");
lines.push("Real art already dropped in for: " + (Object.keys(OVERRIDES).length ? Object.keys(OVERRIDES).map((k) => "`" + k + "`").join(", ") : "none") + ".");
lines.push("");
lines.push("| File | Category | What it is | Seasons | Used by |");
lines.push("| --- | --- | --- | --- | --- |");
for (const cat of categories) {
  for (const e of byCategory.get(cat) ?? []) {
    const used = Array.isArray(e.usedBy) ? e.usedBy.join(", ") : String(e.usedBy);
    lines.push(`| \`${e.filename}\` | ${e.category} | ${e.description} | ${e.seasons} | ${used} |`);
  }
}
writeFileSync(resolve(ROOT, "ASSET_DICTIONARY.md"), lines.join("\n") + "\n");
console.log("ASSET_DICTIONARY.md regenerated");