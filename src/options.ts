import * as core from "./core"

const SEVERITY = {
  error: `emit an error`,
  warning: `emit a warning`,
} as const

export type Severity = keyof typeof SEVERITY

export const DEFAULT_SEVERITY = {
  errorEncountered: "warning",
  pointerFileFound: "warning",
} as const
const severityValuesExplanation = Object.entries(SEVERITY).map(([value, description]) => value + " = " + description).join(", ")

export type LoaderOptions = {
  // Must be kept in sync with SCHEMA.
  pointerFileFound: Severity
  errorEncountered: Severity
}

export const SCHEMA = {
  // Must be kept in sync with the LoaderOptions type.
  type: "object" as const,
  properties: {
    errorEncountered: {
      description: `What should happen if a file cannot be checked successfully (${severityValuesExplanation}). Default: ${DEFAULT_SEVERITY.errorEncountered}.`,
      anyOf: [
        { enum: Object.keys(SEVERITY) },
      ],
    },
    pointerFileFound: {
      description: `What should happen if a ${core.gitLfsPointerFile} is found (${severityValuesExplanation}). Default: ${DEFAULT_SEVERITY.pointerFileFound}.`,
      anyOf: [
        { enum: Object.keys(SEVERITY) },
      ],
    },
  },
  additionalProperties: false,
}

{
  // And now for some Curry–Howard shenanigans …
  type Structure<T> = { [k in keyof T]: T[k] extends Record<string, unknown> ? Structure<T[k]> : never }
  type SchemaStructure<T> = T extends { properties: infer Props } ? { [k in keyof Props]: SchemaStructure<Props[k]> } : never
  (x: Structure<LoaderOptions>): SchemaStructure<typeof SCHEMA> => {
    // LoaderOptions has all keys from SCHEMA.
    return x
  }
  (x: SchemaStructure<typeof SCHEMA>): Structure<LoaderOptions> => {
    // SCHEMA has all keys from LoaderOptions.
    return x
  }
}
