import * as core from "../src/core"

import { assertPreconditions, theLines } from "./util"

const errorMessages = "Error messages"

describe("Git integration", () => {
  assertPreconditions()

  test("Empty file", () => {
    expectPointerFile(false, core.isGitLfsPointerFile(Buffer.from("")))
  })

  test("Regular file", () => {
    expectPointerFile(false, core.isGitLfsPointerFile(Buffer.from(theLines(
      `halloj`
    ))))
  })

  test("LFS pointer file", () => {
    expectPointerFile(true, core.isGitLfsPointerFile(Buffer.from(theLines(
      `version https://git-lfs.github.com/spec/v1`,
      `oid sha256:9eb87db2c3c42fe1f771040c4aea9c5e9272654c1c82e6da24574d450294cd40`,
      `size 22549`,
    ))))
  })

  void `
  The tests below don't check the error messages, because they might depend on the Git version etc.
  Error messages are tested in the ${errorMessages} test suite.
  `

  test("Git not found", () => {
    const command = [ "githalloj", [ "lfs", "pointer", "--check", "--stdin" ] ] as const
    expect(core.isGitLfsPointerFile(Buffer.from(""), command)._).toBe("failure")
  })

  test("Git LFS not installed", () => {
    const command = [ "git", [ "lfshalloj", "pointer", "--check", "--stdin" ] ] as const
    expect(core.isGitLfsPointerFile(Buffer.from(""), command)._).toBe("failure")
  })

  test("Unknown git-lfs subcommand", () => {
    const command = [ "git", [ "lfs", "halloj", "--check", "--stdin" ] ] as const
    expect(core.isGitLfsPointerFile(Buffer.from(""), command)._).toBe("failure")
  })

  test("Unknown git-lfs flag", () => {
    const command = [ "git", [ "lfs", "pointer", "--halloj", "--stdin" ] ] as const
    expect(core.isGitLfsPointerFile(Buffer.from(""), command)._).toBe("failure")
  })

  test("Unexpected error", () => {
    const command = [ "git", [ "lfs", "pointer", "--check", "--stdin" ] ] as const
    const bufferSizeThatShouldCauseEPIPE = 1_050_000 // Anything above 219 264 B causes an EPIPE error on my machine at the time of writing, but I deliberately chose a size just north of 1 MiB (1 048 576 B) to err on the side of caution.
    const tooLargeBuffer = Buffer.from(new Uint8Array(bufferSizeThatShouldCauseEPIPE).buffer)
    const result = core.isGitLfsPointerFile(tooLargeBuffer, command)
    if (result._ === "failure") {
      expect(result.error.message).toContain("spawnSync git EPIPE")
    } else {
      failDueToUnexpectedResult(result)
    }
  })
})

describe(errorMessages, () => {
  test("Git not found", () => {
    const actual = core.interpretGitResult(
      [ "git", [ "lfs", "pointer", "--check", "--stdin" ] ],
      {
        error: {
          code: "ENOENT",
          errno: -2,
          message: "spawnSync git ENOENT",
          name: "Error",
          path: "git",
          spawnargs: [ "lfs", "pointer", "--check", "--stdin" ],
          syscall: "spawnSync git",
        } as Error,
        signal: null,
        status: 1,
        stderr: Buffer.from(""),
      },
    )
    const expected = theLines(
      `The command 'git lfs pointer --check --stdin' failed with this error:`,
      ``,
      `    git: command not found`,
      ``,
    )
    expectError(expected, actual)
  })

  test("Git LFS not installed", () => {
    const actual = core.interpretGitResult(
      [ "git", [ "lfs", "pointer", "--check", "--stdin" ] ],
      {
        error: undefined,
        signal: null,
        status: 1,
        stderr: Buffer.from(theLines(
          `git: 'lfs' is not a git command. See 'git --help'.`,
          ``,
          `The most similar command is`,
          `\tlog`,
        )),
      },
    )
    const expected = theLines(
      `The command 'git lfs pointer --check --stdin' failed with this error:`,
      ``,
      `    git: 'lfs' is not a git command. See 'git --help'.`,
      `    `,
      `    The most similar command is`,
      `    \tlog`,
      ``,
      `Is Git LFS installed?`,
    )
    expectError(expected, actual)
  })

  test("Unknown git-lfs subcommand", () => {
    const actual = core.interpretGitResult(
      [ "git", [ "lfs", "halloj", "--check", "--stdin" ] ],
      {
        error: undefined,
        signal: null,
        status: 127,
        stderr: Buffer.from(theLines(
          `Error: unknown command "halloj" for "git-lfs"`,
          `Run 'git-lfs --help' for usage.`,
        )),
      },
    )
    const expected = theLines(
      `The command 'git lfs halloj --check --stdin' failed with this error:`,
      ``,
      `    Error: unknown command "halloj" for "git-lfs"`,
      `    Run 'git-lfs --help' for usage.`,
      ``,
    )
    expectError(expected, actual)
  })

  test("Unknown git-lfs flag", () => {
    const actual = core.interpretGitResult(
      [ "git", [ "lfs", "pointer", "--halloj", "--stdin" ] ],
      {
        error: undefined,
        signal: null,
        status: 127,
        stderr: Buffer.from(theLines(
          `Error: unknown flag: --halloj`,
          `git lfs pointer --file=path/to/file`,
          `git lfs pointer --file=path/to/file --pointer=path/to/pointer`,
          `git lfs pointer --file=path/to/file --stdin`,
          `git lfs pointer --check --file=path/to/file`,
          ``,
          `Builds and optionally compares generated pointer files to ensure consistency`,
          `between different Git LFS implementations.`,
          ``,
          `Options:`,
          ``,
          `* --file:`,
          `    A local file to build the pointer from.`,
          ``,
          `* --pointer:`,
          `    A local file including the contents of a pointer generated from another`,
          `    implementation.  This is compared to the pointer generated from --file.`,
          ``,
          `* --stdin:`,
          `    Reads the pointer from STDIN to compare with the pointer generated from`,
          `    --file.`,
          ``,
          `* --check:`,
          `    Reads the pointer from STDIN (if --stdin is given) or the filepath (if`,
          `    --file) is given. If neither or both of --stdin and --file are given,`,
          `    the invocation is invalid. Exits 0 if the data read is a valid Git LFS`,
          `    pointer. Exits 1 otherwise.`,
          ``,
        )),
      },
    )
    const expected = theLines(
      `The command 'git lfs pointer --halloj --stdin' failed with this error:`,
      ``,
      `    Error: unknown flag: --halloj`,
      `    git lfs pointer --file=path/to/file`,
      `    git lfs pointer --file=path/to/file --pointer=path/to/pointer`,
      `    git lfs pointer --file=path/to/file --stdin`,
      `    git lfs pointer --check --file=path/to/file`,
      `    `,
      `    Builds and optionally compares generated pointer files to ensure consistency`,
      `    between different Git LFS implementations.`,
      `    `,
      `    Options:`,
      `    `,
      `    * --file:`,
      `        A local file to build the pointer from.`,
      `    `,
      `    * --pointer:`,
      `        A local file including the contents of a pointer generated from another`,
      `        implementation.  This is compared to the pointer generated from --file.`,
      `    `,
      `    * --stdin:`,
      `        Reads the pointer from STDIN to compare with the pointer generated from`,
      `        --file.`,
      `    `,
      `    * --check:`,
      `        Reads the pointer from STDIN (if --stdin is given) or the filepath (if`,
      `        --file) is given. If neither or both of --stdin and --file are given,`,
      `        the invocation is invalid. Exits 0 if the data read is a valid Git LFS`,
      `        pointer. Exits 1 otherwise.`,
      ``,
    )
    expectError(expected, actual)
  })

  test("Unexpected error", () => {
    const actual = core.interpretGitResult(
      [ "git", [ "lfs", "pointer", "--check", "--stdin" ] ],
      {
        error: {
          code: "EPIPE", // Happens if more than 1 048 576 bytes are passed as stdin to the Git child process. Just an example though.
          errno: -32,
          message: "spawnSync git EPIPE",
          name: "Error",
          path: "git",
          spawnargs: [ "lfs", "pointer", "--check", "--stdin" ],
          syscall: "spawnSync git",
        } as Error,
        signal: null,
        status: 1,
        stderr: Buffer.from(""),
      },
    )
    const expected = theLines(
      `The command 'git lfs pointer --check --stdin' failed with this error:`,
      ``,
      `    spawnSync git EPIPE`,
      ``,
    )
    expectError(expected, actual)
  })

  test("Interrupted by signal", () => {
    const actual = core.interpretGitResult(
      [ "git", [ "lfs", "pointer", "--check", "--stdin" ] ],
      {
        error: undefined,
        signal: "SIGKILL",
        status: null,
        stderr: Buffer.from(""),
      },
    )
    const expected = theLines(
      `The command 'git lfs pointer --check --stdin' was terminated by a SIGKILL signal.`,
    )
    expectError(expected, actual)
  })
})

function expectPointerFile(expectPointerFile: boolean, result: ReturnType<typeof core.isGitLfsPointerFile>): void {
  if (result._ === "success") {
    expect(result.isPointerFile).toBe(expectPointerFile)
  } else {
    failDueToUnexpectedResult(result)
  }
}

function expectError(expectedMessage: string, result: ReturnType<typeof core.isGitLfsPointerFile>): void {
  if (result._ === "failure") {
    expect(result.error).toHaveProperty("message", expectedMessage)
  } else {
    failDueToUnexpectedResult(result)
  }
}

function failDueToUnexpectedResult(result: ReturnType<typeof core.isGitLfsPointerFile>): void {
  const details = (
    result._ === "success"
      ? result.isPointerFile.toString()
      : `${result.error.name}: ${result.error.message}`
  )
  fail(`Unexpected ${result._}: ${details}`)
}
