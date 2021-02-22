import * as webpack from "webpack"

import * as loader from "./loader"

export default function<Content extends Buffer>(
  this: webpack.loader.LoaderContext,
  content: Content,
): Content {
  return loader.run(this, content)
}

/**
 * Makes webpack feed the file content as a Buffer and not a string.
 * Makes sense for this loader since it's intended to be applied to files likely to be LFS'd (images etc).
 * In particular, it's _necessary_ for files larger than 512 MiB – otherwise webpack fails with `Error: Cannot create a string longer than 0x1fffffe8 characters`.
 */
export const raw = true
