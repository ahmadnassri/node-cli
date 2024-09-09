import { parseArgs } from 'node:util'
import debug from './debug.js'
import help from './help.js'

import Ajv from 'ajv'

// a wrapper for parseArgs that accepts options with multiple aliases and uses tokens to map back the aliases values to the original options
export default function ({ padding = 30, args, help: { usage, examples } = {}, options, strict, allowNegative, allowPositionals }) {
  let hasAliases = false
  const aliasesMap = {}
  const valuesSchema = {
    type: 'object',
    properties: {},
    required: []
  }

  options = {
    help: {
      type: 'boolean',
      short: 'h',
      description: 'print command line options'
    },
    ...options
  }

  if (args) debug('args:', args)

  const { values, positionals, tokens } = parseArgs({ args, options, allowNegative, allowPositionals, strict: false, tokens: true })

  // detect help and exit early
  // display help
  if (tokens.find(({ kind, name }) => kind === 'option' && (['help', 'h'].includes(name)))) {
    debug('help called')

    help({ padding, usage, examples, options })
    process.exit(0)
    return // useful when running tests
  }

  // manage options
  for (const [name, { required, schema, aliases = [] } = {}] of Object.entries(options)) {
    for (const alias of aliases) {
      aliasesMap[alias] = name
      hasAliases = true
    }

    valuesSchema.properties[name] = schema || {}
    if (required) valuesSchema.required.push(name)
  }

  if (hasAliases) {
    debug('aliases:', aliasesMap)

    // map alias to their original options
    for (const { name, value } of tokens.filter(({ kind }) => kind === 'option')) {
      const original = aliasesMap[name]

      if (original) {
        debug('matched alias:', name, '->', original)

        const finalValue = value || values[name]

        if (!options[original].multiple) {
          values[original] = finalValue
        } else {
          if (values[original] === undefined) values[original] = []
          values[original].push(finalValue)
        }

        // remove alias from values
        if (strict) {
          debug('deleting alias:', name)
          delete values[name]
        }
      }
    }
  }

  // validate values
  const ajv = new Ajv({ allErrors: true, messages: true })
  const validate = ajv.compile(valuesSchema)

  const valid = validate(values)

  if (!valid) {
    for (const error of validate.errors) {
      // customize error messages
      if (error.keyword === 'required') {
        error.message = `--${error.params.missingProperty} is required`
      } else {
        error.message = `--${error.instancePath.replace('/', '')} ${error.message}`
      }

      console.error(`❌ ${error.message}`)
    }

    console.error()
    help({ padding, usage, examples, options })

    process.exit(1)
    return // useful when running tests
  }

  return { values, positionals }
}
