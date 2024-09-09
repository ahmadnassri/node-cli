## Features

a drop-in replacement for the built-in [`parseArgs`][parseargs] function, with the following features:

- **Aliases** - support for multiple aliases
- **Validation** - validate options with JSON Schema
- **Help** - automated help message generated from the `options` object

## Usage

### `parser(config)`

The method accepts the same `config` object as the built-in `parseArgs` function, with the following additions:

| Option          | Type     | Description                       | Default |
| --------------- | -------- | --------------------------------- | ------- |
| `padding`       | `number` | the padding for the help messages | `30`    |
| `help`          | `object` | the help message object           | `{}`    |
| `help.usage`    | `string` | the usage message                 | `''`    |
| `help.examples` | `string` | the examples message              | `''`    |
| `options`       | `object` | the options object                | `{}`    |

### `options`

The `options` object accepts the same properties as the built-in `parseArgs` function, with the following additions:

| Option        | Type      | Description                                | Default |
| ------------- | --------- | ------------------------------------------ | ------- |
| `arg`         | `string`  | the option input name (displayed in help)  | `''`    |
| `description` | `string`  | the option description (displayed in help) | `''`    |
| `aliases`     | `array`   | an array of aliases                        | `[]`    |
| `schema`      | `object`  | a JSON Schema object for validation        | `{}`    |
| `required`    | `boolean` | whether the option is required             | `false` |

###### Example

```js
import parser from './src/index.js'

const help = {
  usage: 'example [options]',
  examples: 'example --color blue --color green'
}

const options = {
  color: {
    short: 'c',
    arg: 'name',
    type: 'string',
    description: 'a long by thoughtfully written description about this property',
    required: true,
    multiple: true,
    default: ['blue', 'green'],
    aliases: ['colour'],
    schema: {
      type: 'array',
      items: {
        enum: ['blue', 'green']
      }
    }
  }
}

const { values, positionals } = parser({ help, options })

console.log(`color: ${values.color}`)
console.log(`positionals: ${positionals}`)
```

###### `--help`

```plain
USAGE
example [options]

OPTIONS
  -h, --help                  print command line options
  -c, --color* <name>         a long by thoughtfully written description about this property
                              accepts multiple | default: blue,green | choices: blue, green | aliases: --colour

EXAMPLES
example --color blue --color green
```

###### `--color=green --colour=blue foo bar`

```plain
color: green,blue
positionals: foo,bar
```

###### `--color=red`

```plain
❌ --color must be equal to one of the allowed values

USAGE
example [options] 

OPTIONS
  -h, --help                  print command line options
  -c, --color* <name>         a long by thoughtfully written description about this property
                              accepts multiple | default: blue,green | aliases: --colour
                              
EXAMPLES
example --color blue --color green 
```

[parseargs]: https://nodejs.org/api/util.html#utilparseargsconfig
