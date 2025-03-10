import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Liveness probe for the container healthcheck.
 *
 * Deliberately trivial: it answers as soon as the Next.js server is accepting
 * requests, and depends on nothing that could make a healthy process look sick.
 */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ status: "ok" });
}
