import fs from "fs";
import path from "path";
import type { ServerResponse } from "http";

import type { Dataset } from "./datasets";

/**
 * The subset of `NextApiResponse` this helper needs. Narrowing it keeps the
 * function testable without standing up a Next.js server.
 */
export type DatasetResponse = Pick<
  ServerResponse,
  "setHeader" | "statusCode" | "end"
> & {
  status: (code: number) => DatasetResponse;
  json: (body: unknown) => void;
};

/**
 * Streams a declared dataset file to the client.
 *
 * The three API routes each used to inline their own `fs.createReadStream`
 * call, and two of them located the file with `path.join(__dirname, "../../../
 * ../../public/...")`. That happens to resolve under a default `next build`,
 * but it encodes the compiler's output layout rather than the project's, and it
 * breaks under `output: "standalone"`. Resolving from `process.cwd()` -- the
 * project root under `next dev`, `next start` and a standalone server alike --
 * is both correct and legible.
 */
export function serveDataset(
  res: DatasetResponse,
  dataset: Dataset,
  rootDir: string = process.cwd(),
): void {
  const file = path.join(rootDir, dataset.path);

  let size: number;
  try {
    size = fs.statSync(file).size;
  } catch (error) {
    console.error(`dataset missing: ${dataset.path}`, error);
    res.status(404).json({ error: "dataset unavailable" });
    return;
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", size);
  res.setHeader(
    "Cache-Control",
    `public, max-age=${dataset.maxAgeSeconds}, immutable`,
  );

  const stream = fs.createReadStream(file);
  stream.on("error", (error) => {
    console.error(`failed to read ${dataset.path}`, error);
    // Headers are already on the wire by the time a stream error can land, so
    // the only honest move left is to cut the response short.
    res.end();
  });
  stream.pipe(res as unknown as ServerResponse);
}

