import { beforeEach, afterEach, describe, test } from 'node:test'
import sinon from 'sinon'

import parser from '../src/index.js'

beforeEach(() => {
  sinon.stub(process, 'exit')
  sinon.stub(console, 'error')
  sinon.stub(console, 'info')
})

afterEach(() => {
  sinon.restore()
})

describe('booleans', () => {
  test('basic', t => {
    t.plan(1)

    const args = ['--colour']
    const options = {
      color: { type: 'boolean', aliases: ['colour'] }
    }

    const { values } = parser({ args, options })

    t.assert.deepEqual(values, { color: true, colour: true })
  })

  test('negative', t => {
    t.plan(1)

    const args = ['--no-colour']
    const options = {
      color: { type: 'boolean', aliases: ['colour'] }
    }

    const { values } = parser({ args, options, allowNegative: true })

    t.assert.deepEqual(values, { color: false, colour: false })
  })
})

describe('advanced', () => {
  test('strict', t => {
    t.plan(1)

    const args = ['--colour']
    const options = {
      color: { type: 'boolean', aliases: ['colour'] }
    }

    const { values } = parser({ args, options, strict: true })

    t.assert.deepEqual(values, { color: true })
  })

  test('multiple', t => {
    t.plan(1)

    const args = ['--colour=red', '--colour=blue']

    const options = {
      color: { type: 'string', multiple: true, aliases: ['colour'] }
    }

    const { values } = parser({ args, options, strict: true })

    t.assert.deepEqual(values, { color: ['red', 'blue'] })
  })

  test('last one wins', t => {
    t.plan(1)

    const args = ['--no-colour', '--col']
    const options = {
      color: { type: 'boolean', aliases: ['colour', 'col'] }
    }

    const { values } = parser({ args, options, allowNegative: true, strict: true })

    t.assert.deepEqual(values, { color: true })
  })
})

describe('validation', () => {
  test('should fail on schema errors', t => {
    t.plan(5)

    const args = ['--color', 'red']
    const options = {
      color: { type: 'string', schema: { enum: ['blue', 'green'] } }
    }

    const returns = parser({ args, options, strict: true })

    t.assert.ok(process.exit.calledOnce)
    t.assert.ok(process.exit.lastCall.calledWith(1))
    t.assert.ok(console.error.called)
    t.assert.equal(console.error.firstCall.args[0], '❌ --color must be equal to one of the allowed values')
    t.assert.equal(returns, undefined)
  })

  test('should fail on missing required', t => {
    t.plan(5)

    const args = []
    const options = {
      color: { type: 'string', required: true }
    }

    const returns = parser({ args, options, strict: true })

    t.assert.ok(process.exit.calledOnce)
    t.assert.ok(process.exit.lastCall.calledWith(1))
    t.assert.ok(console.error.called)
    t.assert.equal(console.error.firstCall.args[0], '❌ --color is required')
    t.assert.equal(returns, undefined)
  })
})

describe('help', () => {
  test('usage', t => {
    t.plan(5)

    const args = ['--help']

    const help = {
      usage: 'foo bar'
    }

    parser({ args, help })

    t.assert.ok(process.exit.calledOnce)
    t.assert.ok(process.exit.lastCall.calledWith(0))
    t.assert.equal(console.info.callCount, 4)
    t.assert.match(console.info.firstCall.args[0], /USAGE/)
    t.assert.match(console.info.secondCall.args[0], new RegExp(help.usage))
  })

  test('examples', t => {
    t.plan(5)

    const args = ['--help']

    const help = {
      examples: 'baz qux'
    }

    parser({ args, help })

    t.assert.ok(process.exit.calledOnce)
    t.assert.ok(process.exit.lastCall.calledWith(0))
    t.assert.equal(console.info.callCount, 4)
    t.assert.match(console.info.thirdCall.args[0], /EXAMPLES/)
    t.assert.match(console.info.lastCall.args[0], new RegExp(help.examples))
  })

  describe('options', () => {
    test('only options', t => {
      t.plan(5)

      const args = ['--help']

      const options = {
        color: { type: 'string' }
      }

      parser({ args, options })

      t.assert.ok(process.exit.calledOnce)
      t.assert.ok(process.exit.lastCall.calledWith(0))
      t.assert.equal(console.info.callCount, 3)
      t.assert.match(console.info.firstCall.args[0], /OPTIONS/)
      t.assert.match(console.info.lastCall.args[0], /--color/)
    })

    test('arg', t => {
      t.plan(1)

      const args = ['--help']

      const options = {
        color: { type: 'string', arg: 'name' }
      }

      parser({ args, options })

      t.assert.match(console.info.lastCall.args[0], /--color.+<name>/)
    })

    test('required', t => {
      t.plan(1)

      const args = ['--help']

      const options = {
        required: { type: 'string', required: true }
      }

      parser({ args, options })

      t.assert.match(console.info.lastCall.args[0], /--required.+\*/)
    })

    test('description', t => {
      t.plan(1)

      const args = ['--help']

      const options = {
        foo: { type: 'string', description: 'bar' }
      }

      parser({ args, options })

      t.assert.match(console.info.lastCall.args[0], /--foo.+bar/)
    })

    test('short', t => {
      t.plan(1)

      const args = ['--help']

      const options = {
        long: { type: 'string', short: 's' }
      }

      parser({ args, options })

      t.assert.match(console.info.lastCall.args[0], /-s, --long/)
    })

    test('default', t => {
      t.plan(1)

      const args = ['--help']

      const options = {
        color: { type: 'string', default: 'red' }
      }

      parser({ args, options })

      t.assert.match(console.info.lastCall.args[0], /--color.+default:.+red/)
    })

    test('multiple', t => {
      t.plan(1)

      const args = ['--help']

      const options = {
        color: { type: 'string', multiple: true }
      }

      parser({ args, options })

      t.assert.match(console.info.lastCall.args[0], /--color.+accepts multiple/)
    })

    test('aliases', t => {
      t.plan(1)

      const args = ['--help']

      const options = {
        foo: { type: 'string', aliases: ['bar', 'baz'] }
      }

      parser({ args, options })

      t.assert.match(console.info.lastCall.args[0], /--foo.+aliases: .+--bar, --baz/)
    })

    test('choices', t => {
      t.plan(1)

      const args = ['--help']

      const options = {
        color: { type: 'string', schema: { enum: ['blue', 'green'] } }
      }

      parser({ args, options })

      t.assert.match(console.info.lastCall.args[0], /--color.+choices: .+blue, green/)
    })

    test('combined', t => {
      t.plan(1)

      const args = ['--help']

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
          schema: { enum: ['blue', 'green'] }
        }
      }

      parser({ args, options })

      t.assert.match(console.info.lastCall.args[0], /-c, --color.+\*.+<name>.+description.+\n.+accepts multiple.+|.+default:.+blue,green|.+choices:.+blue, green.+|.+aliases: --colour/)
    })
  })
})
