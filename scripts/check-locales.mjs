// Dev utility: verifies every locale mirrors the reference (fr) key structure.
// Run with: node scripts/check-locales.mjs
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import esbuild from "esbuild";

const dir = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "../src/i18n/locales");
const codes = ["fr", "ar", "en", "es", "de", "it", "tr", "pt", "ru", "zh"];

async function load(code) {
  const src = fs.readFileSync(path.join(dir, `${code}.ts`), "utf8");
  const { code: js } = esbuild.transformSync(src, { loader: "ts", format: "esm" });
  const mod = await import("data:text/javascript;base64," + Buffer.from(js).toString("base64"));
  return mod.default;
}

function leaves(obj, prefix = "") {
  const out = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const l of leaves(v, key)) out.add(l);
    } else {
      out.add(key);
    }
  }
  return out;
}

const reference = leaves(await load("fr"));
let ok = true;

for (const code of codes) {
  const set = leaves(await load(code));
  const missing = [...reference].filter((k) => !set.has(k));
  const extra = [...set].filter((k) => !reference.has(k));
  const status = missing.length === 0 && extra.length === 0 ? "OK " : "FAIL";
  if (status === "FAIL") ok = false;
  console.log(
    `${status} ${code}  ${set.size}/${reference.size}` +
      (missing.length ? `  missing: ${missing.slice(0, 5).join(", ")}` : "") +
      (extra.length ? `  extra: ${extra.slice(0, 5).join(", ")}` : ""),
  );
}

console.log(ok ? "\nAll locales match the reference." : "\nSome locales diverge.");
process.exit(ok ? 0 : 1);
