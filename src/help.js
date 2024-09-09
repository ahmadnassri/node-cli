import { bold, italic, red, dim } from './shell.js'

export default function ({ padding, usage, examples, options }) {
  if (usage) {
    console.info(bold('USAGE'))
    console.info(usage, '\n')
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

  if (examples) {
    console.info(bold('EXAMPLES'))
    console.info(examples, '\n')
  }
}
