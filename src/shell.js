// follow Node.js color conventions
const noColors = process.env.NO_COLOR || process.env.NODE_DISABLE_COLORS

/* node:coverage disable */
function wrap (val, str) {
  if (noColors) return str

  return `\x1b[${val}m${str}\x1b[0m`
}

export function yellow (str) {
  return wrap(33, str)
}

export function dim (str) {
  return wrap(2, str)
}

export function italic (str) {
  return wrap(3, str)
}

export function bold (str) {
  return wrap(1, str)
}

export function red (str) {
  return wrap(31, str)
}
/* node:coverage enable */
