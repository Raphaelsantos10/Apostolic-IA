import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createBackupManifest,
  verifyBackupManifest
} from "./backup-manifest.mjs";

test("cria e verifica manifesto SHA-256", async () => {
  const root = await mkdtemp(join(tmpdir(), "apostolic-backup-"));
  const database = join(root, "database.sql");
  await writeFile(database, "backup de teste\n");

  const manifest = await createBackupManifest([database], {
    root,
    now: () => "2026-07-28T00:00:00.000Z"
  });
  const result = await verifyBackupManifest(manifest, { root });

  assert.equal(manifest.formatVersion, 1);
  assert.equal(manifest.algorithm, "sha256");
  assert.equal(manifest.files[0].path, "database.sql");
  assert.equal(result.passed, true);
});

test("detecta backup alterado depois do manifesto", async () => {
  const root = await mkdtemp(join(tmpdir(), "apostolic-backup-"));
  const database = join(root, "database.sql");
  await writeFile(database, "conteúdo original\n");
  const manifest = await createBackupManifest([database], { root });

  await writeFile(database, "conteúdo alterado\n");
  const result = await verifyBackupManifest(manifest, { root });

  assert.equal(result.passed, false);
});

test("rejeita caminhos fora do diretório do manifesto", async () => {
  const root = await mkdtemp(join(tmpdir(), "apostolic-backup-"));
  const outside = join(tmpdir(), "apostolic-outside.sql");
  await writeFile(outside, "fora\n");

  await assert.rejects(
    createBackupManifest([outside], { root }),
    /inside the manifest directory/
  );

  await assert.rejects(
    verifyBackupManifest(
      {
        formatVersion: 1,
        algorithm: "sha256",
        files: [
          {
            path: join("..", "apostolic-outside.sql"),
            bytes: 5,
            sha256: "0".repeat(64)
          }
        ]
      },
      { root }
    ),
    /unsafe path/
  );
});
