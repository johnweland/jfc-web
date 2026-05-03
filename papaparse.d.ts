declare module "papaparse" {
  export type ParseError = {
    code: string
    message: string
    row?: number
    type?: string
  }

  export type ParseConfig = {
    header?: boolean
    skipEmptyLines?: boolean | "greedy"
    transformHeader?: (header: string, index: number) => string
  }

  export type ParseResult<T = Record<string, string>> = {
    data: T[]
    errors: ParseError[]
    meta: {
      fields?: string[]
    }
  }

  export type UnparseConfig = {
    columns?: string[]
  }

  const Papa: {
    parse<T = Record<string, string>>(input: string, config?: ParseConfig): ParseResult<T>
    unparse<T extends Record<string, unknown>>(data: T[], config?: UnparseConfig): string
  }

  export default Papa
}
