import { createHash } from "node:crypto";
import { lstat, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

function safeRelativePath(root, filePath) {
  const value = relative(root, resolve(filePath));
  if (!value || value === ".." || value.startsWith(`..${sep}`) || isAbsolute(value)) {
    throw new TypeError("backup file must be inside the manifest directory");
  }
  return value.split(sep).join("/");
}

function resolveManifestEntry(root, entryPath) {
  if (
    typeof entryPath !== "string" ||
    !entryPath ||
    isAbsolute(entryPath)
  ) {
    throw new TypeError("manifest contains an unsafe path");
  }
  const absolutePath = resolve(root, entryPath);
  try {
    safeRelativePath(resolve(root), absolutePath);
  } catch {
    throw new TypeError("manifest contains an unsafe path");
  }
  return absolutePath;
}

export async function sha256File(filePath) {
  const content = await readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

export async function createBackupManifest(
  filePaths,
  {
    root = process.cwd(),
    now = () => new Date().toISOString()
  } = {}
) {
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    throw new TypeError("at least one backup file is required");
  }

  const entries = [];
  for (const filePath of filePaths) {
    const absolutePath = resolve(filePath);
    const information = await lstat(absolutePath);
    if (!information.isFile() || information.isSymbolicLink()) {
      throw new TypeError("backup entry must be a regular file");
    }
    entries.push({
      path: safeRelativePath(resolve(root), absolutePath),
      bytes: information.size,
      sha256: await sha256File(absolutePath)
    });
  }

  entries.sort((left, right) => left.path.localeCompare(right.path));
  return {
    formatVersion: 1,
    generatedAt: now(),
    algorithm: "sha256",
    files: entries
  };
}

export async function verifyBackupManifest(
  manifest,
  { root = process.cwd() } = {}
) {
  if (
    manifest?.formatVersion !== 1 ||
    manifest?.algorithm !== "sha256" ||
    !Array.isArray(manifest?.files)
  ) {
    throw new TypeError("unsupported backup manifest");
  }

  const results = [];
  for (const entry of manifest.files) {
    const filePath = resolveManifestEntry(resolve(root), entry.path);
    try {
      const information = await lstat(filePath);
      const digest = await sha256File(filePath);
      results.push({
        path: entry.path,
        passed:
          information.isFile() &&
          !information.isSymbolicLink() &&
          information.size === entry.bytes &&
          digest === entry.sha256
      });
    } catch {
      results.push({ path: entry.path, passed: false });
    }
  }

  return {
    passed: results.length > 0 && results.every((entry) => entry.passed),
    files: results
  };
}

async function runCli() {
  const [command, manifestArgument, ...fileArguments] = process.argv.slice(2);
  if (!["create", "verify"].includes(command) || !manifestArgument) {
    throw new TypeError(
      "usage: backup-manifest.mjs <create|verify> <manifest.json> [files...]"
    );
  }

  const manifestPath = resolve(manifestArgument);
  const root = dirname(manifestPath);

  if (command === "create") {
    const manifest = await createBackupManifest(
      fileArguments.map((filePath) => resolve(filePath)),
      { root }
    );
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
      flag: "wx"
    });
    process.stdout.write(`Manifesto criado: ${manifestPath}\n`);
    return;
  }

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const result = await verifyBackupManifest(manifest, { root });
  if (!result.passed) {
    process.stderr.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await runCli();
}
