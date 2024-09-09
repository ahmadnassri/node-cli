import { parseArgs } from 'node:util'
import debug from './debug.js'
import { bold, italic, red, dim } from './shell.js'

import Ajv from 'ajv'

// a wrapper for parseArgs that accepts options with multiple aliases and uses tokens to map back the aliases values to the original options
export default function ({ padding = 30, args, help, options, strict, allowNegative, allowPositionals }) {
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

    if (help && help.usage) {
      console.info(bold('USAGE'))
      console.info(help.usage, '\n')
    }

    if (options) {
      console.info(bold('OPTIONS'))

      // start with a 2 char padding

      for (const [name, o] of Object.entries(options)) {
        let line = '  '

        line += `${o.short ? `-${o.short}, ` : ''}`
        line += `--${name}${o.required ? red('*') : ''}`
        line += `${o.arg ? dim(` <${o.arg}>`) : ''}`

        // determine lenth of padding
        const clean = line.replace(/\x1b\[.*?m/g, '') // remove color codes

        line = line.padEnd(padding + (line.length - clean.length))

        line += `${o.description ? o.description : ''}`

        const hasNotes = o.multiple || o.default !== undefined || o.schema?.enum || o.aliases

        line += o.description && hasNotes ? '\n'.padEnd(padding + 1) : ''

        const notes = []
        if (o.multiple) notes.push(italic('accepts multiple'))
        if (o.default !== undefined) notes.push(italic(`default: ${dim(o.default)}`))
        if (o.schema?.enum) notes.push(italic(`choices: ${dim(o.schema.enum.join(', '))}`))
        if (o.aliases) notes.push(italic(`aliases: ${dim(`--${o.aliases.join(', --')}`)}`))

        line += notes.join(' | ')

        line += o.description && hasNotes ? '\n'.padEnd(padding + 1) : ''

        console.info(line)
      }
    }

    if (help && help.examples) {
      console.info(bold('EXAMPLES'))
      console.info(help.examples, '\n')
    }

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

    process.exit(1)
    return // useful when running tests
  }

  return { values, positionals }
}
