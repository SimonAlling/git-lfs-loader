import * as webpack from "webpack"

import * as loader from "../src/loader"
import * as options from "../src/options"

import { assertPreconditions, theLines } from "./util"

type LoaderContext = webpack.loader.LoaderContext

/* eslint-disable @typescript-eslint/unbound-method */ // emitError and emitWarning can be tested without being bound.

describe("Loader", () => {
  assertPreconditions()

  test("Empty file", () => {
    const context = freshDefaultContext()
    const input = Buffer.from("")
    const output = loader.run(context, input)
    expect(output).toBe(input)
    expect(context.emitError).not.toHaveBeenCalled()
    expect(context.emitWarning).not.toHaveBeenCalled()
  })

  test("Regular file", () => {
    const context = freshDefaultContext()
    const input = Buffer.from(theLines(
      `halloj`
    ))
    const output = loader.run(context, input)
    expect(output).toBe(input)
    expect(context.emitError).not.toHaveBeenCalled()
    expect(context.emitWarning).not.toHaveBeenCalled()
  })

  test("LFS pointer file", () => {
    const context = freshDefaultContext()
    const input = Buffer.from(theLines(
      `version https://git-lfs.github.com/spec/v1`,
      `oid sha256:9eb87db2c3c42fe1f771040c4aea9c5e9272654c1c82e6da24574d450294cd40`,
      `size 22549`,
    ))
    const output = loader.run(context, input)
    expect(output).toBe(input)
    expect(context.emitError).not.toHaveBeenCalled()
    expect(context.emitWarning).toHaveBeenCalledTimes(1)
  })

  test("Too large file", () => {
    const context = freshDefaultContext()
    const bufferSizeThatShouldCauseEPIPE = 1_050_000 // Anything above 219 264 B causes an EPIPE error on my machine at the time of writing, but I deliberately chose a size just north of 1 MiB (1 048 576 B) to err on the side of caution.
    const input = Buffer.from(new Uint8Array(bufferSizeThatShouldCauseEPIPE).buffer)
    const output = loader.run(context, input)
    expect(output).toBe(input)
    expect(context.emitError).not.toHaveBeenCalled()
    expect(context.emitWarning).not.toHaveBeenCalled()
  })

  test("pointerFileFound: warning", () => {
    const context = freshContext({
      pointerFileFound: "warning",
      errorEncountered: "warning",
    })
    const input = Buffer.from(theLines(
      `version https://git-lfs.github.com/spec/v1`,
      `oid sha256:9eb87db2c3c42fe1f771040c4aea9c5e9272654c1c82e6da24574d450294cd40`,
      `size 22549`,
    ))
    const output = loader.run(context, input)
    expect(output).toBe(input)
    expect(context.emitError).not.toHaveBeenCalled()
    expect(context.emitWarning).toHaveBeenCalledTimes(1)
  })

  test("pointerFileFound: error", () => {
    const context = freshContext({
      pointerFileFound: "error",
      errorEncountered: "warning",
    })
    const input = Buffer.from(theLines(
      `version https://git-lfs.github.com/spec/v1`,
      `oid sha256:9eb87db2c3c42fe1f771040c4aea9c5e9272654c1c82e6da24574d450294cd40`,
      `size 22549`,
    ))
    const output = loader.run(context, input)
    expect(output).toBe(input)
    expect(context.emitError).toHaveBeenCalledTimes(1)
    expect(context.emitWarning).not.toHaveBeenCalled()
  })
})

function freshDefaultContext() {
  return freshContext({
    // The values are hardcoded here so changing the default values breaks tests.
    pointerFileFound: "warning",
    errorEncountered: "warning",
  })
}

/**
 * Creates a fresh loader context with mock emitters that have not been called before.
 */
function freshContext(options: options.LoaderOptions): LoaderContext {
  return {
    query: options,
    emitError: mockEmitter(),
    emitWarning: mockEmitter(),
  } as LoaderContext
}

function mockEmitter() {
  return jest.fn() as (error: Error) => void
}
