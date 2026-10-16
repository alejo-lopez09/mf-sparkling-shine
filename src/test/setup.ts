import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll } from "vitest";

process.env.DATABASE_URL = "";
const testDataPath = path.join(os.tmpdir(), `mf-sparkling-shine-${randomUUID()}.json`);
process.env.APP_DATA_FILE = testDataPath;

afterAll(async () => {
  await rm(testDataPath, { force: true });
});
