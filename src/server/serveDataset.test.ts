import fs from "fs";
import os from "os";
import path from "path";
import { PassThrough } from "stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { datasets } from "./datasets";
import { serveDataset, type DatasetResponse } from "./serveDataset";

/**
 * A stand-in for `NextApiResponse`. It is a real writable stream, so the
 * helper's `pipe` works exactly as it does in production, while the headers and
 * any error body are captured for inspection.
 *
 * Nothing here touches the network: the fixtures are written to a temp
 * directory and read back off disk.
 */
class FakeResponse extends PassThrough {
  headers: Record<string, string | number> = {};
  statusCode = 200;
  body: unknown;

  setHeader(name: string, value: string | number) {
    this.headers[name.toLowerCase()] = value;
    return this as never;
  }

  status(code: number) {
    this.statusCode = code;
    return this as unknown as DatasetResponse;
  }

  json(body: unknown) {
    this.body = body;
  }

  collect(): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      this.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      this.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      this.on("error", reject);
    });
  }
}

const asResponse = (fake: FakeResponse) =>
  fake as unknown as DatasetResponse;

let rootDir: string;

beforeEach(() => {
  rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "serve-dataset-"));
  fs.mkdirSync(path.join(rootDir, "public"), { recursive: true });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  fs.rmSync(rootDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

const writeFixture = (relativePath: string, contents: string) => {
  fs.writeFileSync(path.join(rootDir, relativePath), contents);
};

describe("serveDataset", () => {
  it("streams the file back verbatim", async () => {
    const contents = JSON.stringify([[1, 2] as const, [3, 4] as const]);
    writeFixture(datasets.brazilCoastline.path, contents);

    const res = new FakeResponse();
    const received = res.collect();
    serveDataset(asResponse(res), datasets.brazilCoastline, rootDir);

    expect(await received).toBe(contents);
  });

  it("declares JSON, the exact length, and a cache policy", async () => {
    const contents = JSON.stringify({ hello: "world" });
    writeFixture(datasets.brazilCoastline.path, contents);

    const res = new FakeResponse();
    const received = res.collect();
    serveDataset(asResponse(res), datasets.brazilCoastline, rootDir);
    await received;

    expect(res.headers["content-type"]).toBe("application/json; charset=utf-8");
    expect(res.headers["content-length"]).toBe(Buffer.byteLength(contents));
    expect(res.headers["cache-control"]).toBe(
      `public, max-age=${datasets.brazilCoastline.maxAgeSeconds}, immutable`,
    );
  });

  it("answers 404 when the dataset is missing instead of hanging", () => {
    const res = new FakeResponse();
    serveDataset(asResponse(res), datasets.brazilCoastline, rootDir);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: "dataset unavailable" });
    expect(res.headers["content-type"]).toBeUndefined();
  });

  it("resolves paths against the given root, not the compiler's output layout", async () => {
    // The two country routes used to locate their files with
    // path.join(__dirname, "../../../../../public/..."), which encodes where
    // webpack happens to put the compiled route. Passing a root proves the
    // resolution is a property of the project instead.
    writeFixture(datasets.countryCoordinatePolygons.path, "[]");

    const res = new FakeResponse();
    const received = res.collect();
    serveDataset(asResponse(res), datasets.countryCoordinatePolygons, rootDir);

    expect(await received).toBe("[]");
  });
});

describe("the dataset registry", () => {
  it("points every entry at a file that exists in this repository", () => {
    for (const [name, dataset] of Object.entries(datasets)) {
      const file = path.join(process.cwd(), dataset.path);
      expect(fs.existsSync(file), `${name} -> ${dataset.path}`).toBe(true);
    }
  });

  it("keeps every dataset inside the project", () => {
    for (const dataset of Object.values(datasets)) {
      expect(path.isAbsolute(dataset.path)).toBe(false);
      expect(dataset.path).not.toContain("..");
    }
  });

  it("gives every dataset a positive cache lifetime", () => {
    for (const dataset of Object.values(datasets)) {
      expect(dataset.maxAgeSeconds).toBeGreaterThan(0);
    }
  });
});
