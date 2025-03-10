import type { NextApiRequest, NextApiResponse } from "next";

import { datasets } from "../../../server/datasets";
import { serveDataset } from "../../../server/serveDataset";

/** Every country outline, in longitude and latitude. */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  serveDataset(res, datasets.countryCoordinatePolygons);
}

// Next.js buffers API responses and caps them at 4 MB. These files are streamed
// straight from disk, so the cap is lifted. Next parses this export statically:
// it has to be an object literal, not an imported constant.
export const config = {
  api: {
    responseLimit: false,
  },
};
