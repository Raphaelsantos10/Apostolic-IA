import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const sourceDirectory = process.argv[2];
if (!sourceDirectory) {
  console.error("Uso: node scripts/install-local-bibles.mjs <pasta-com-json>");
  process.exit(1);
}

const versions = ["ARA", "ARC", "JFAA", "KJA", "KJF", "NAA", "NTLH", "NVI"];
const targetDirectory = path.resolve("apps/web/public/bibles-local");
await mkdir(targetDirectory, { recursive: true });
const installed = [];

for (const code of versions) {
  const candidates = [`${code}.json`, `${code}(1).json`];
  let selected = null;
  for (const candidate of candidates) {
    try {
      const source = path.resolve(sourceDirectory, candidate);
      const data = JSON.parse(await readFile(source, "utf8"));
      if (!Array.isArray(data) || data.length !== 66) throw new Error("estrutura inválida");
      selected = source;
      break;
    } catch { /* Tenta o próximo nome. */ }
  }
  if (!selected) continue;
  const file = `${code}.json`;
  await copyFile(selected, path.join(targetDirectory, file));
  installed.push({ code, name: code, file });
}

await writeFile(path.join(targetDirectory, "manifest.json"), JSON.stringify({ versions: installed }, null, 2));
console.log(`${installed.length} tradução(ões) instalada(s) somente para teste local: ${installed.map((item) => item.code).join(", ")}`);
console.log("Não inclua apps/web/public/bibles-local em commits ou publicações.");
