import { Schema } from './types'
import $RefParserOptions from './options'

type Path = string
type Options = $RefParserOptions | Partial<$RefParserOptions>
type Callback = (err, data) => void
type PossibleArgs =
  | [Path | Schema, Options, Callback]
  | [Path | Schema, Options]
  | [Path, Schema, Options, Callback]
  | [Path, Schema, Options]
/**
 * Normalizes the given arguments, accounting for optional args.
 *
 * @param {Arguments} args
 * @returns {object}
 */
export function normalizeArgs(args: PossibleArgs) {
  let path: Path
  let schema: Schema | undefined
  let options: Options
  let callback: Callback | undefined
  args = Array.prototype.slice.call(args)

  if (typeof args[args.length - 1] === 'function') {
    // The last parameter is a callback function
    callback = args.pop() as Callback
  }

  if (typeof args[0] === 'string') {
    // The first parameter is the path
    path = args[0] as Path
    if (typeof args[2] === 'object') {
      // The second parameter is the schema, and the third parameter is the options
      schema = args[1] as Schema
      options = args[2] as Options
    } else {
      // The second parameter is the options
      schema = undefined
      options = args[1] as Options
    }
  } else {
    // The first parameter is the schema
    path = ''
    schema = args[0] as Schema
    options = args[1] as Options
  }

  if (!(options instanceof $RefParserOptions)) {
    options = new $RefParserOptions(options)
  }

  return {
    path,
    schema,
    options: options as $RefParserOptions,
    callback
  }
}
