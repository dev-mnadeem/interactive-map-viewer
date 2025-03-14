import type { NextApiRequest, NextApiResponse } from "next";

import { datasets } from "../../server/datasets";
import { serveDataset } from "../../server/serveDataset";

/** Brazil's coastline, as centimetre measurements on the paper map. */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  serveDataset(res, datasets.brazilCoastline);
}

// Next.js buffers API responses and caps them at 4 MB. These files are streamed
// straight from disk, so the cap is lifted. Next parses this export statically:
// it has to be an object literal, not an imported constant.
export const config = {
  api: {
    responseLimit: false,
  },
};
