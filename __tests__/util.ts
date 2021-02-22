import * as child_process from "child_process"

export function assertPreconditions(): void {
  {
    const { error, status } = child_process.spawnSync("git", [ "--help" ], {
      timeout: 500, // ms
    })
    if (error !== undefined || status !== 0) {
      throw `Git must be installed to run these tests.`
    }
  }
  {
    const { error, status } = child_process.spawnSync("git", [ "lfs", "--help" ], {
      timeout: 500, // ms
    })
    if (error !== undefined || status !== 0) {
      throw `Git LFS must be installed to run these tests.`
    }
  }
}

export function theLines(...lines: readonly string[]): string {
  return lines.join("\n")
}
