import { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema'
export type Schema = JSONSchema4 | JSONSchema6 | JSONSchema7

export interface FileObject {
  url: string
  extension: string
}
export interface FileWithData extends FileObject {
  data: any
}

export type Falsy = false | null | undefined | '' | 0
