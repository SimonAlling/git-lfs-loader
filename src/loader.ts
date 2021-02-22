import { getOptions } from "loader-utils"
import { validate } from "schema-utils"
import * as webpack from "webpack"

import * as core from "./core"
import * as options from "./options"

const LOADER_NAME = "git-lfs-loader"

/**
 * The hard upper limit seems to be 219 264, at least on my machine; anything larger causes an EPIPE error at the time of writing.
 * But Git LFS pointer files are usually around 130 bytes in size, so this should be a good enough heuristic.
 * We don't want to waste time checking files that are highly unlikely to be LFS pointer files, even if we can.
 */
const MAX_CONTENT_LENGTH = 1000

type LoaderContext = webpack.loader.LoaderContext

export function run<Content extends Buffer>(
  loaderContext: LoaderContext,
  content: Content,
): Content {
  if (content.length > MAX_CONTENT_LENGTH) {
    return content
  }
  const optionsFromUser = getOptions(loaderContext) as options.LoaderOptions
  validate(options.SCHEMA, optionsFromUser, {
    name: LOADER_NAME,
    baseDataPath: "options", // So error messages say e.g. "options.foo should be …" and not "configuration.foo should be …".
  })
  const severity = {
    errorEncountered: defaultTo(options.DEFAULT_SEVERITY.errorEncountered, optionsFromUser.errorEncountered),
    pointerFileFound: defaultTo(options.DEFAULT_SEVERITY.pointerFileFound, optionsFromUser.pointerFileFound),
  }
  handleResult(loaderContext, severity, core.isGitLfsPointerFile(content))
  return content
}

function handleResult(
  loaderContext: LoaderContext,
  severity: {
    errorEncountered: options.Severity
    pointerFileFound: options.Severity
  },
  result: ReturnType<typeof core.isGitLfsPointerFile>,
): void {
  switch (result._) {
    case "success":
      if (result.isPointerFile) {
        handleError(loaderContext, severity.pointerFileFound, `This looks like a ${core.gitLfsPointerFile}. You may want to run 'git lfs pull' to checkout the actual file.`)
      }
      break
    case "failure":
      handleError(loaderContext, severity.errorEncountered, `Could not check if this is a ${core.gitLfsPointerFile}. ${result.error.message}`)
      break
    default:
      ((x: never) => { throw x })(result) // Enforces `switch` exhaustiveness.
  }
}

function handleError(
  loaderContext: LoaderContext,
  severity: options.Severity,
  errorMessage: string,
): void {
  const error = new Error(errorMessage)
  switch (severity) {
    case "error":
      loaderContext.emitError(error)
      break
    case "warning":
      loaderContext.emitWarning(error)
      break
    default:
      ((x: never) => { throw x })(severity) // Enforces `switch` exhaustiveness.
  }
}

function defaultTo<T, D extends T>(def: D, x: T | undefined): T {
  return x === undefined ? def : x
}
