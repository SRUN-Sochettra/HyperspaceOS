import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
test("22 apps remain registered", async () => {
  const os = await readFile(new URL("../src/core/OS.js", import.meta.url), "utf8");
  const registrations = [...os.matchAll(/import\('\.\.\/apps\/[^']+\/index\.js'\)/g)];
  assert.equal(registrations.length, 22);
});
test("remote font and seeded remote media URLs are absent", async () => {
  const fonts = await readFile(new URL("../src/styles/fonts.css", import.meta.url), "utf8");
  const video = await readFile(new URL("../src/apps/video/Video.js", import.meta.url), "utf8");
  const photos = await readFile(new URL("../src/apps/photos/Photos.js", import.meta.url), "utf8");
  assert.doesNotMatch(fonts, /@import|fonts\.googleapis/i);
  assert.doesNotMatch(video, /w3schools|https?:\/\//i);
  assert.doesNotMatch(photos, /sample\.png|tiny red pixel/i);
});
