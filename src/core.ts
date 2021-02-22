import * as child_process from "child_process"

export const gitLfsPointerFile = "Git LFS pointer file"

type Command = readonly [ string, readonly string[] ]

const COMMAND = [ "git", [ "lfs", "pointer", "--check", "--stdin" ] ] as const

export function isGitLfsPointerFile(content: Buffer, command: Command = COMMAND) { // Allowing a custom command makes the function easier to test.
  // Running the Git process takes around 10 ms (on my machine), so that should be done as few times as possible.
  return interpretGitResult(
    command,
    child_process.spawnSync(...command, {
      timeout: 500, // ms
      input: content,
    }),
  )
}

type Result =
  | { _: "success", isPointerFile: boolean }
  | { _: "failure", error: Error }

export function interpretGitResult(
  command: Command,
  { error, signal, status, stderr }: Pick<child_process.SpawnSyncReturns<Buffer>, "error" | "signal" | "status" | "stderr">,
): Result {
  const commandFailedWith = commandFailed(command)
  if (error !== undefined) { // An `instanceof Error` check doesn't work because `spawnSync` doesn't return actual Errors, just objects implementing the `Error` _interface_.
    return failure(
      isEnoent(error)
        ? commandFailedWith(`${error.path}: command not found`)
        : commandFailedWith(error.message)
    )
  }

  if (status === null) {
    /**
     * > * `status` `<number>` | `<null>` The exit code of the subprocess, or `null` if the subprocess terminated due to a signal.
     * > * `signal` `<string>` | `<null>` The signal used to kill the subprocess, or `null` if the subprocess did not terminate due to a signal.
     *
     * https://nodejs.org/docs/latest/api/child_process.html#child_process_child_process_spawnsync_command_args_options
     */
    const shouldNeverHappen = `Neither exit code nor terminating signal was reported for the command '${showCommand(command)}'.`
    return failure(
      signal === null
        ? shouldNeverHappen
        : `The command '${showCommand(command)}' was terminated by a ${signal} signal.`
    )
  }

  if (status === 1 && stderr.includes("is not a git command")) { // Exit code is also 1 when the file is not an LFS pointer file.
    return failure(commandFailedWith(stderr.toString()) + `\nIs Git LFS installed?`)
  }

  if (status > 1) { // `git lfs halloj`, `git lfs pointer --halloj` etc …
    return failure(commandFailedWith(stderr.toString()))
  }

  return { _: "success", isPointerFile: status === 0 }
}

function commandFailed(command: Command) {
  return (errorMessage: string) => `The command '${showCommand(command)}' failed with this error:\n\n${indent(errorMessage.trimEnd())}\n`
}

function failure(message: string) {
  return { _: "failure", error: new Error(message) } as const
}

function showCommand([ executable, parameters ]: Command): string {
  return executable + " " + parameters.join(" ") // We do this instead of using Array.prototype.flat to support Node 10.
}

function isEnoent(error: Error & { code?: string }): error is Error & { path: string } {
  return error.code === "ENOENT"
}

function indent(text: string): string {
  return text.replace(/^/gm, "    ")
}
